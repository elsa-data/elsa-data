import { AuthenticatedUser } from "../authenticated-user";
import * as edgedb from "edgedb";
import e from "../../../dbschema/edgeql-js";
import { inject, injectable } from "tsyringe";
import {
  CloudTrailClient,
  GetQueryResultsCommand,
  StartQueryCommand,
} from "@aws-sdk/client-cloudtrail";
import { AwsBaseService } from "./aws-base-service";
import { AuditLogService } from "./audit-log-service";
import { ElsaSettings } from "../../config/elsa-settings";
import { AwsAccessPointService } from "./aws-access-point-service";
import { Logger } from "pino";
import maxmind, { CityResponse, Reader } from "maxmind";
import { touchRelease } from "../db/release-queries";
import { NotAuthorisedSyncDataAccessEvents } from "../exceptions/audit-authorisation";
import {
  updateLastDataEgressQueryTimestamp,
  updateReleaseDataEgress,
} from "../../../dbschema/queries";

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
  releaseKey: string;
  auditId: string;
};

@injectable()
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
  private maxmindLookup: Reader<CityResponse> | undefined = undefined;

  private checkIsAllowedRefreshDatasetIndex(user: AuthenticatedUser): void {
    const isPermissionAllow = user.isAllowedRefreshDatasetIndex;
    if (isPermissionAllow) return;

    throw new NotAuthorisedSyncDataAccessEvents();
  }

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
        lastDataEgressQueryTimestamp: true,
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
    if (!releaseDates.lastDataEgressQueryTimestamp) {
      return releaseDates.created.toISOString();
    }

    // Adding 1 ms from previous query to prevent overlap results.
    const dateObj = new Date(releaseDates.lastDataEgressQueryTimestamp);
    dateObj.setTime(dateObj.getTime() + 1);

    return dateObj.toISOString();
  }

  /**
   * CloudTrailLake Helper function
   */

  /**
   * CloudTrailLake SDK Input builder
   * @param sqlStatement
   * @returns
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

  /**
   * CloudTrailLake SDK query builder
   * @param params
   * @returns
   */
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

  /**
   * Record responses from CloudTrailLake to edgeDb
   * @param
   */
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

      await updateReleaseDataEgress(this.edgeDbClient, {
        releaseKey,
        description,
        auditId: trailEvent.auditId,

        occurredDateTime: utcDate,
        sourceIpAddress: trailEvent.sourceIPAddress,
        sourceLocation: loc,

        egressBytes: parseInt(trailEvent.bytesTransferredOut),
        fileUrl: s3Url,
      });
    }
    await touchRelease.run(this.edgeDbClient, { releaseKey: releaseKey });
  }

  /**
   * Query and Record from CloudTrailLake API.
   * @param param
   */
  private async queryAndRecord({
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
   * Create SQL CloudTrailLake statement for PresignedUrl
   * Ref: https://docs.aws.amazon.com/awscloudtrail/latest/userguide/query-limitations.html
   *
   * @param props
   * @returns
   */
  private createSQLQueryByReleaseKeyReqParams(
    props: CloudTrailInputQueryType & { releaseKey: string }
  ): string {
    const requestedField =
      "element_at(requestParameters, 'x-auditId') as auditId, " +
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

  /**
   * Create SQL CloudTrailLake statement for Access Point (AP)
   * @param props
   * @returns
   */
  private createSQLQueryByAccessPointAlias(
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

  /**
   * This function should sync data access events from CloudTrailLake.
   *
   * Notes:
   *
   *  - Query CloudTrailLake by timestamp to save querying cost (by minimizing record scanned).
   *    Ref: https://www.linkedin.com/pulse/querying-aws-cloudtrail-athena-vs-lake-steve-kinsman?trk=pulse-article_more-articles_related-content-card
   *  - CloudTrailLake may take 15 minutes or more before it starts to appear.
   *    Ref: https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-lake.html
   *
   * @param user
   * @param releaseKey
   * @param eventDataStoreIds
   */
  public async fetchCloudTrailLakeLog({
    user,
    releaseKey,
    datasetUrisArray,
  }: {
    user: AuthenticatedUser;
    releaseKey: string;
    datasetUrisArray: string[];
  }) {
    this.checkIsAllowedRefreshDatasetIndex(user);

    const eventDataStoreIds = await this.getEventDataStoreIdFromDatasetUris(
      datasetUrisArray
    );
    if (!eventDataStoreIds) throw new Error("No AWS CloudTrailLake Configured");

    const startQueryDate = await this.findCloudTrailStartTimestamp(releaseKey);
    const endQueryDate = new Date();
    const endQueryDateISO = endQueryDate.toISOString();

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
            endTimestamp: endQueryDateISO,
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
              endTimestamp: endQueryDateISO,
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
    updateLastDataEgressQueryTimestamp(this.edgeDbClient, {
      releaseKey,
      lastQueryTimestamp: endQueryDate,
    });
    await touchRelease.run(this.edgeDbClient, { releaseKey: releaseKey });
  }
}
