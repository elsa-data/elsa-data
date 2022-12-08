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

type CloudTrailInputQueryType = {
  eventDataStoreId: string;
  releaseId: string;
  s3KeyObject?: string;
  startTimestamp?: string /* Unix time in 'YYYY-DD-MM 00:00:00.000', example: '2022-07-05 22:00:00.000' */;
  endTimestamp?: string /* Unix time in 'YYYY-DD-MM 00:00:00.000', example: '2022-07-05 23:00:00.000' */;
};

type CloudTrailLakeResponseType = {
  releaseId: string;
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
    @inject("CloudTrailClient") private cloudTrailClient: CloudTrailClient,
    usersService: UsersService,
    auditLogService: AuditLogService
  ) {
    super(edgeDbClient, usersService, auditLogService);
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

  async findCloudTrailStartTimestamp(
    releaseId: string
  ): Promise<string | null> {
    const lastQueryDate = (
      await e
        .select(e.release.Release, (r) => ({
          lastDateTimeDataAccessLogQuery: true,
          filter: e.op(r.id, "=", e.uuid(releaseId)),
        }))
        .assert_single()
        .run(this.edgeDbClient)
    )?.lastDateTimeDataAccessLogQuery;

    // First time query no need startTime let it query all records available
    if (!lastQueryDate) return null;

    // Adding 1 ms from previous query to prevent overlap results.
    const dateObj = new Date(lastQueryDate);
    dateObj.setTime(dateObj.getTime() + 1);

    return dateObj.toISOString();
  }

  async recordCloudTrailLake(records: CloudTrailLakeResponseType[]) {
    for (const trailEvent of records) {
      const s3Url = `s3://${trailEvent.bucketName}/${trailEvent.key}`;

      // CloudTrail time always UTC time, adding UTC postfix to make sure recorded properly.
      const utcDate = new Date(`${trailEvent.eventTime} UTC`);

      await this.auditLogService.updateDataAccessAuditEvent({
        executor: this.edgeDbClient,
        releaseId: trailEvent.releaseId,
        who: trailEvent.sourceIPAddress,
        fileUrl: s3Url,
        description: "Presigned URL accessed.",
        egressBytes: parseInt(trailEvent.bytesTransferredOut),
        date: utcDate,
      });
    }
  }
  /**
   * Function specific for presignedUrl CloudTrailLake query
   */
  createSQLQueryByReleaseIdParams(props: CloudTrailInputQueryType): string {
    // Ref: https://docs.aws.amazon.com/awscloudtrail/latest/userguide/query-limitations.html
    const requestedField =
      "element_at(requestParameters, 'x-releaseId') as releaseId, " +
      "eventTime, " +
      "sourceIPAddress, " +
      "element_at(requestParameters, 'bucketName') as bucketName, " +
      "element_at(requestParameters, 'key') as key, " +
      "element_at(additionalEventData, 'bytesTransferredOut') as bytesTransferredOut";

    let sqlStatement =
      `SELECT ${requestedField} FROM ${props.eventDataStoreId} ` +
      `WHERE (element_at(requestParameters, 'x-releaseId') = '${props.releaseId}') `;

    // Additional filter
    if (props.startTimestamp)
      sqlStatement += `AND eventTime >= '${props.startTimestamp}'`;
    if (props.endTimestamp)
      sqlStatement += `AND eventTime <= '${props.endTimestamp}'`;
    if (props.s3KeyObject)
      sqlStatement += `AND element_at(requestParameters, 'key') = '${props.s3KeyObject}'`;

    return sqlStatement;
  }

  // Ideally might be an interval job (perhaps run weekly? or maybe 7days after releaseAudit)
  async syncPresignCloudTrailLakeLog({
    releaseId,
    eventDataStoreIds,
  }: {
    releaseId: string;
    eventDataStoreIds: string[];
  }) {
    // CloudTrailLake record is partition by timestamp. To save querying cost (by minimizing record scanned),
    // we would specify the timestamp interval for each query.
    // Ref: https://www.linkedin.com/pulse/querying-aws-cloudtrail-athena-vs-lake-steve-kinsman?trk=pulse-article_more-articles_related-content-card

    // Also note that from cloudtrail-lake docs, it may take 15 minutes or more before logs appear in CloudTrail lake
    // Ref: https://docs.aws.amazon.com/awscloudtrail/latest/userguide/cloudtrail-lake.html

    const startQueryDate = await this.findCloudTrailStartTimestamp(releaseId);
    const endQueryDate = new Date().toISOString();

    for (const edsi of eventDataStoreIds) {
      const sqlQueryStatement = this.createSQLQueryByReleaseIdParams({
        startTimestamp: startQueryDate ?? undefined,
        endTimestamp: endQueryDate,
        releaseId: releaseId,
        eventDataStoreId: edsi,
      });

      const queryId = await this.startCommandQueryCloudTrailLake(
        sqlQueryStatement
      );
      const s3CloudTrailLogs = (await this.getResultQueryCloudTrailLakeQuery({
        queryId: queryId,
        eventDataStoreId: edsi,
      })) as CloudTrailLakeResponseType[];

      await this.recordCloudTrailLake(s3CloudTrailLogs);
    }

    // Update last query date to release record
    await e
      .update(e.release.Release, (r) => ({
        filter: e.op(r.id, "=", e.uuid(releaseId)),
        set: {
          lastDateTimeDataAccessLogQuery: e.datetime(endQueryDate),
        },
      }))
      .run(this.edgeDbClient);
  }
}
