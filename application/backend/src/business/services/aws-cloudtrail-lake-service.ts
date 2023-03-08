import { AuthenticatedUser } from "../authenticated-user";
import * as edgedb from "edgedb";
import e from "../../../dbschema/edgeql-js";
import { inject, injectable, singleton } from "tsyringe";
import {
  CloudTrailClient,
  StartQueryCommand,
  GetQueryResultsCommand,
} from "@aws-sdk/client-cloudtrail";
import { UsersService } from "./users-service";
import { AwsBaseService } from "./aws-base-service";
import { AuditLogService } from "./audit-log-service";
import { ElsaSettings } from "../../config/elsa-settings";
import { AwsAccessPointService } from "./aws-access-point-service";
import { Logger } from "pino";
import maxmind, { CityResponse, Reader } from "maxmind";
import { touchRelease } from "../db/release-queries";

enum CloudTrailQueryType {
  PresignUrl = "PresignUrl",
  S3AccessPoint = "S3AccessPoint",
}

type CloudTrailInputQueryType = {
  eventDataStoreId: string;
  s3KeyObject?: string;
  startTimestamp?: string /* Unix time in 'YYYY-DD-MM 00:00:00.000', example: '2022-07-05 22:00:00.000' */;
  endTimestamp?: string /* Unix time in 'YYYY-DD-MM 00:00:00.000', example: '2022-07-05 23:00:00.000' */;
};

type CloudTrailLakeResponseType = {
  eventTime: string;
  sourceIPAddress: string;
  bucketName: string;
  key: string;
  bytesTransferredOut: string;
};

@injectable()
@singleton()
export class AwsCloudTrailLakeService extends AwsBaseService {
  constructor(
    @inject("Settings") private settings: ElsaSettings,
    @inject("Database") protected edgeDbClient: edgedb.Client,
    @inject("Logger") private readonly logger: Logger,
    @inject("CloudTrailClient") private cloudTrailClient: CloudTrailClient,
    private awsAccessPointService: AwsAccessPointService,
    private auditLogService: AuditLogService
  ) {
    super();
  }

  maxmindLookup: Reader<CityResponse> | undefined = undefined;

  async getEventDataStoreIdFromDatasetUris(
    datasetUris: string[]
  ): Promise<string[] | undefined> {
    const eventDataStoreIdArr: string[] = [];
    for (const dataset of this.settings.datasets) {
      if (datasetUris.includes(dataset.uri)) {
        const id = dataset.aws?.eventDataStoreId;

        if (id) eventDataStoreIdArr.push(id);
      }
    }
    return eventDataStoreIdArr;
  }
  async findCloudTrailStartTimestamp(
    releaseKey: string
  ): Promise<string | null> {
    const releaseDates = await e
      .select(e.release.Release, (r) => ({
        created: true,
        lastDateTimeDataAccessLogQuery: true,
        filter: e.op(r.releaseKey, "=", releaseKey),
      }))
      .assert_single()
      .run(this.edgeDbClient);

    if (!releaseDates) {
      this.logger.warn(
        `Could not found matching releaseKey ('${releaseKey}') record.`
      );
      return null;
    }

    // If have not been queried before, will be using the release created date.
    if (!releaseDates.lastDateTimeDataAccessLogQuery) {
      return releaseDates.created.toISOString();
    }

    // Adding 1 ms from previous query to prevent overlap results.
    const dateObj = new Date(releaseDates.lastDateTimeDataAccessLogQuery);
    dateObj.setTime(dateObj.getTime() + 1);

    return dateObj.toISOString();
  }

  /**
   * CloudTrailLake Helper function
   */
  async startCommandQueryCloudTrailLake(sqlStatement: string): Promise<string> {
    // Sending request to query
    const command = new StartQueryCommand({ QueryStatement: sqlStatement });
    const queryResponse = await this.cloudTrailClient.send(command);
    const queryId = queryResponse.QueryId;
    if (queryId) {
      return queryId;
    } else {
      throw new Error("Unable to create a query");
    }
  }

  async getResultQueryCloudTrailLakeQuery(params: {
    queryId: string;
    eventDataStoreId: string;
  }): Promise<Record<string, string>[]> {
    // Setting up init variables
    let nextToken: undefined | string;
    const queryResult: Record<string, string>[] = [];

    // Will query all 'NextToken' result in the query result
    do {
      const command = new GetQueryResultsCommand({
        EventDataStore: params.eventDataStoreId,
        QueryId: params.queryId,
        NextToken: nextToken,
      });
      const cloudtrail_query_result_response = await this.cloudTrailClient.send(
        command
      );
      if (!cloudtrail_query_result_response.QueryResultRows) break;

      for (const row of cloudtrail_query_result_response.QueryResultRows) {
        let record: any = {};
        for (const stringMap of row) {
          record = { ...record, ...stringMap };
        }
        queryResult.push(record);
      }
      nextToken = cloudtrail_query_result_response.NextToken;
    } while (nextToken);
    return queryResult;
  }

  async recordCloudTrailLake({
    lakeResponse,
    releaseKey,
    description,
  }: {
    lakeResponse: CloudTrailLakeResponseType[];
    description: string;
    releaseKey: string;
  }) {
    for (const trailEvent of lakeResponse) {
      const s3Url = `s3://${trailEvent.bucketName}/${trailEvent.key}`;

      // CloudTrail time always UTC time, adding UTC postfix to make sure recorded properly.
      const utcDate = new Date(`${trailEvent.eventTime} UTC`);

      // Find location based on IP
      let loc = "-";
      if (this.maxmindLookup) {
        const ipInfo = this.maxmindLookup.get(trailEvent.sourceIPAddress);
        const city = ipInfo?.city?.names.en;
        const country = ipInfo?.country?.names.en;
        if (city || country) {
          loc = `${ipInfo?.city?.names.en}, ${ipInfo?.country?.names.en}`;
        }
      }

      await this.auditLogService.updateDataAccessAuditEvent({
        executor: this.edgeDbClient,
        releaseKey: releaseKey,
        whoId: trailEvent.sourceIPAddress,
        whoDisplayName: loc,
        fileUrl: s3Url,
        description: description,
        egressBytes: parseInt(trailEvent.bytesTransferredOut),
        date: utcDate,
      });
    }
  }

  async queryAndRecord({
    sqlQueryStatement,
    eventDataStoreId,
    releaseKey,
    recordDescription,
  }: {
    sqlQueryStatement: string;
    eventDataStoreId: string;
    releaseKey: string;
    recordDescription: string;
  }) {
    const queryId = await this.startCommandQueryCloudTrailLake(
      sqlQueryStatement
    );
    const s3CloudTrailLogs = (await this.getResultQueryCloudTrailLakeQuery({
      queryId: queryId,
      eventDataStoreId: eventDataStoreId,
    })) as CloudTrailLakeResponseType[];

    await this.recordCloudTrailLake({
      lakeResponse: s3CloudTrailLogs,
      releaseKey: releaseKey,
      description: recordDescription,
    });
  }

  /**
   * SQL Queries builder
   * Ref: https://docs.aws.amazon.com/awscloudtrail/latest/userguide/query-limitations.html
   */
  createSQLQueryByReleaseKeyReqParams(
    props: CloudTrailInputQueryType & { releaseKey: string }
  ): string {
    const requestedField =
      "element_at(requestParameters, 'x-releaseKey') as releaseKey, " +
      "eventTime, " +
      "sourceIPAddress, " +
      "element_at(requestParameters, 'bucketName') as bucketName, " +
      "element_at(requestParameters, 'key') as key, " +
      "element_at(additionalEventData, 'bytesTransferredOut') as bytesTransferredOut";

    let sqlStatement =
      `SELECT ${requestedField} FROM ${props.eventDataStoreId} ` +
      `WHERE (element_at(requestParameters, 'x-releaseKey') = '${props.releaseKey}') `;

    // Additional filter
    if (props.startTimestamp)
      sqlStatement += `AND eventTime >= '${props.startTimestamp}'`;
    if (props.endTimestamp)
      sqlStatement += `AND eventTime <= '${props.endTimestamp}'`;
    if (props.s3KeyObject)
      sqlStatement += `AND element_at(requestParameters, 'key') = '${props.s3KeyObject}'`;

    return sqlStatement;
  }

  createSQLQueryByAccessPointAlias(
    props: CloudTrailInputQueryType & {
      apAlias: string;
    }
  ): string {
    const requestedField =
      "eventTime, " +
      "sourceIPAddress, " +
      "element_at(requestParameters, 'bucketName') as bucketName, " +
      "element_at(requestParameters, 'key') as key, " +
      "element_at(additionalEventData, 'bytesTransferredOut') as bytesTransferredOut";

    const conditionStatement = `element_at(requestParameters, 'Host') LIKE '${props.apAlias}%'`;

    let sqlStatement =
      `SELECT ${requestedField} ` +
      `FROM ${props.eventDataStoreId} ` +
      `WHERE (${conditionStatement}) `;

    // Additional filter
    if (props.startTimestamp)
      sqlStatement += `AND eventTime >= '${props.startTimestamp}'`;
    if (props.endTimestamp)
      sqlStatement += `AND eventTime <= '${props.endTimestamp}'`;
    if (props.s3KeyObject)
      sqlStatement += `AND element_at(requestParameters, 'key') = '${props.s3KeyObject}'`;

    return sqlStatement;
  }

  // Main Fetching job
  async fetchCloudTrailLakeLog({
    user,
    releaseKey,
    eventDataStoreIds,
  }: {
    user: AuthenticatedUser;
    releaseKey: string;
    eventDataStoreIds: string[];
  }) {
    // CloudTrailLake record is partition by timestamp. To save querying cost (by minimizing record scanned),
    // we would specify the timestamp interval for each query.
    // Ref: https://www.linkedin.com/pulse/querying-aws-cloudtrail-athena-vs-lake-steve-kinsman?trk=pulse-article_more-articles_related-content-card

    // Also note that from cloudtrail-lake docs, it may take 15 minutes or more before logs appear in CloudTrail lake
    // Ref: https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-lake.html

    const startQueryDate = await this.findCloudTrailStartTimestamp(releaseKey);
    const endQueryDate = new Date().toISOString();

    // Try initiate maxmind reader if available
    try {
      this.maxmindLookup = await maxmind.open<CityResponse>(
        `${this.settings.maxmindDbAssetPath}/GeoLite2-City.mmdb`
      );
    } catch (error) {
      this.logger.warn(
        "No maxmind db is configured and therefore will not perform IP city lookup."
      );
    }

    for (const edsi of eventDataStoreIds) {
      for (const method of Object.keys(CloudTrailQueryType)) {
        if (method == CloudTrailQueryType.PresignUrl) {
          const sqlQueryStatement = this.createSQLQueryByReleaseKeyReqParams({
            startTimestamp: startQueryDate ?? undefined,
            endTimestamp: endQueryDate,
            releaseKey: releaseKey,
            eventDataStoreId: edsi,
          });

          this.logger.debug("SQL statement: ", sqlQueryStatement);

          await this.queryAndRecord({
            sqlQueryStatement: sqlQueryStatement,
            eventDataStoreId: edsi,
            recordDescription: "Accessed via presigned url.",
            releaseKey: releaseKey,
          });
        } else if (method == CloudTrailQueryType.S3AccessPoint) {
          const bucketNameMap = (
            await this.awsAccessPointService.getInstalledAccessPointResources(
              user,
              releaseKey
            )
          )?.bucketNameMap;

          const apAlias = bucketNameMap ? Object.values(bucketNameMap) : [];

          for (const a of apAlias) {
            const sqlQueryStatement = this.createSQLQueryByAccessPointAlias({
              startTimestamp: startQueryDate ?? undefined,
              endTimestamp: endQueryDate,
              eventDataStoreId: edsi,
              apAlias: a,
            });

            this.logger.debug("SQL statement: ", sqlQueryStatement);

            await this.queryAndRecord({
              sqlQueryStatement: sqlQueryStatement,
              eventDataStoreId: edsi,
              recordDescription: "Accessed via S3 access point.",
              releaseKey: releaseKey,
            });
          }
        } else {
          this.logger.warn(
            `No matching query type for cloudTrailLake. ('${method}')`
          );
          continue;
        }
      }
    }

    // Update last query date to release record
    await e
      .update(e.release.Release, (r) => ({
        filter: e.op(r.releaseKey, "=", releaseKey),
        set: {
          lastDateTimeDataAccessLogQuery: e.datetime(endQueryDate),
        },
      }))
      .run(this.edgeDbClient);

    await touchRelease.run(this.edgeDbClient, { releaseKey });
  }
}
