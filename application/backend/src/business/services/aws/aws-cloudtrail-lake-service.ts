import { AuthenticatedUser } from "../../authenticated-user";
import * as edgedb from "edgedb";
import e from "../../../../dbschema/edgeql-js";
import { inject, injectable } from "tsyringe";
import {
  CloudTrailClient,
  GetQueryResultsCommand,
  StartQueryCommand,
} from "@aws-sdk/client-cloudtrail";
import { AwsEnabledService } from "./aws-enabled-service";
import { AuditEventService } from "../audit-event-service";
import { ElsaSettings } from "../../../config/elsa-settings";
import { AwsAccessPointService } from "./aws-access-point-service";
import { Logger } from "pino";
import {
  releaseLastUpdatedReset,
  updateLastDataEgressQueryTimestamp,
  updateReleaseDataEgress,
} from "../../../../dbschema/queries";
import { IPLookupService } from "../ip-lookup-service";

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
  eventId: string;
  sourceIPAddress: string;
  bucketName: string;
  key: string;
  bytesTransferredOut: string;
  releaseKey: string;
  auditId: string;
};

@injectable()
export class AwsCloudTrailLakeService {
  constructor(
    @inject("Settings") private readonly settings: ElsaSettings,
    @inject("Database") private readonly edgeDbClient: edgedb.Client,
    @inject("Logger") private readonly logger: Logger,
    @inject("CloudTrailClient")
    private readonly cloudTrailClient: CloudTrailClient,
    @inject(AwsAccessPointService)
    private readonly awsAccessPointService: AwsAccessPointService,
    @inject(AuditEventService)
    private readonly auditLogService: AuditEventService,
    @inject(AwsEnabledService)
    private readonly awsEnabledService: AwsEnabledService,
    @inject(IPLookupService) private readonly ipLookupService: IPLookupService
  ) {}

  async getEventDataStoreIdFromDatasetUris(
    datasetUris: string[]
  ): Promise<string[] | undefined> {
    const eventDataStoreIdArr: string[] = [];
    for (const dataset of this.settings.datasets) {
      if (
        datasetUris.includes(dataset.uri) &&
        dataset.loader === "australian-genomics-directories"
      ) {
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

    // Date is round down to the nearest date (e.g. 27/06/2023 16:22:04 rounded to 27/06/04 00:00:00)
    // As the cost of querying in cloudTrailLake is the interval of days, we might just query
    // all with the same cost.

    // If have not been queried before, will be using the release created date.
    if (!releaseDates.lastDataEgressQueryTimestamp) {
      const createdData = releaseDates.created;
      createdData.setHours(0, 0, 0, 0);

      return createdData.toISOString();
    }

    const dateObj = new Date(releaseDates.lastDataEgressQueryTimestamp);
    dateObj.setHours(0, 0, 0, 0);

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
    await this.awsEnabledService.enabledGuard();

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
    await this.awsEnabledService.enabledGuard();

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
    user,
  }: {
    lakeResponse: CloudTrailLakeResponseType[];
    description: string;
    releaseKey: string;
    user: AuthenticatedUser;
  }) {
    for (const trailEvent of lakeResponse) {
      const s3Url = `s3://${trailEvent.bucketName}/${trailEvent.key}`;

      // CloudTrail time always UTC time, adding UTC postfix to make sure recorded properly.
      const utcDate = new Date(`${trailEvent.eventTime} UTC`);

      // Find location based on IP
      const location = this.ipLookupService.getLocationByIp(
        trailEvent.sourceIPAddress
      );

      await updateReleaseDataEgress(this.edgeDbClient, {
        releaseKey,
        description,
        auditId: trailEvent.auditId,
        egressId: trailEvent.eventId,

        occurredDateTime: utcDate,
        sourceIpAddress: trailEvent.sourceIPAddress,
        sourceLocation: location,

        egressBytes: parseInt(trailEvent.bytesTransferredOut),
        fileUrl: s3Url,
      });
    }

    await releaseLastUpdatedReset(this.edgeDbClient, {
      releaseKey: releaseKey,
      lastUpdatedSubjectId: user.subjectId,
    });
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
    user,
  }: {
    sqlQueryStatement: string;
    eventDataStoreId: string;
    releaseKey: string;
    recordDescription: string;
    user: AuthenticatedUser;
  }) {
    const queryId = await this.startCommandQueryCloudTrailLake(
      sqlQueryStatement
    );
    const s3CloudTrailLogs = await this.getResultQueryCloudTrailLakeQuery({
      queryId: queryId,
      eventDataStoreId: eventDataStoreId,
    });

    await this.recordCloudTrailLake({
      lakeResponse: s3CloudTrailLogs as CloudTrailLakeResponseType[],
      releaseKey: releaseKey,
      description: recordDescription,
      user: user,
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
      "eventId, " +
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
    const eventDataStoreIds = await this.getEventDataStoreIdFromDatasetUris(
      datasetUrisArray
    );
    if (!eventDataStoreIds) throw new Error("No AWS CloudTrailLake Configured");

    const startQueryDate = await this.findCloudTrailStartTimestamp(releaseKey);
    const endQueryDate = new Date();
    const endQueryDateISO = endQueryDate.toISOString();

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
            user: user,
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
              user: user,
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
    await updateLastDataEgressQueryTimestamp(this.edgeDbClient, {
      releaseKey,
      lastQueryTimestamp: endQueryDate,
    });

    await releaseLastUpdatedReset(this.edgeDbClient, {
      releaseKey: releaseKey,
      lastUpdatedSubjectId: user.subjectId,
    });
  }
}
