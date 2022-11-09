import { AuthenticatedUser } from "../authenticated-user";
import * as edgedb from "edgedb";
import { inject, injectable, singleton } from "tsyringe";
import {
  CloudTrailClient,
  StartQueryCommand,
  GetQueryResultsCommand,
} from "@aws-sdk/client-cloudtrail";
import { UsersService } from "./users-service";
import { AwsBaseService } from "./aws-base-service";
import { AuditLogService } from "./audit-log-service";

type CloudTrailInputQueryType = {
  eventDataStoreId: string;
  auditId: string;
  s3KeyObject?: string;
  startTimestamp?: string /* Unix time in 'YYYY-DD-MM 00:00:00.000', example: '2022-07-05 22:00:00.000' */;
  endTimestamp?: string /* Unix time in 'YYYY-DD-MM 00:00:00.000', example: '2022-07-05 23:00:00.000' */;
};

type CloudTrailGetQueryResultParam = {
  queryId: string;
  eventDataStoreId: string;
};

@injectable()
@singleton()
export class AwsCloudTrailLakeService extends AwsBaseService {
  constructor(
    @inject("Database") protected edgeDbClient: edgedb.Client,
    @inject("CloudTrailClient") private cloudTrailClient: CloudTrailClient,
    usersService: UsersService,
    auditLogService: AuditLogService
  ) {
    super(edgeDbClient, usersService, auditLogService);
  }

  /**
   * Getting logs from cloudtrail query
   */

  async requestS3CloudTrailLakeQuery(
    props: CloudTrailInputQueryType
  ): Promise<string> {
    // Ref: https://docs.aws.amazon.com/awscloudtrail/latest/userguide/query-limitations.html
    const requestedField =
      "element_at(requestParameters, 'x-auditId'), " +
      "eventTime, " +
      "sourceIPAddress, " +
      "element_at(requestParameters, 'bucketName') as bucketName, " +
      "element_at(requestParameters, 'key') as key, " +
      "element_at(additionalEventData, 'bytesTransferredOut') as bytesTransferredOut";

    let sqlStatement =
      `SELECT ${requestedField} FROM ${props.eventDataStoreId} ` +
      `WHERE (element_at(requestParameters, 'x-releaseId') = '${props.auditId}') `;

    // Additional filter
    if (props.startTimestamp)
      sqlStatement += `AND eventtime > '${props.startTimestamp}'`;
    if (props.endTimestamp)
      sqlStatement += `AND eventtime < '${props.endTimestamp}'`;
    if (props.s3KeyObject)
      sqlStatement += `AND element_at(requestParameters, 'key') = '${props.s3KeyObject}'`;

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

  async getResultS3CloudTrailLakeQuery(
    params: CloudTrailGetQueryResultParam
  ): Promise<Record<string, string>[]> {
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
        let record = {};
        for (const stringMap of row) {
          record = { ...record, ...stringMap };
        }
        queryResult.push(record);
      }
      nextToken = cloudtrail_query_result_response.NextToken;
    } while (nextToken);
    return queryResult;
  }

  async getCloudTrailLakeEvents(): Promise<Record<string, any>[]> {
    // TODO: Uncomment and need to replace the params below
    // It will need to get eventDataStoreId gotten from AWS CloudTrail Stack
    // const queryId = await this.requestS3CloudTrailLakeQuery(param);
    // const s3CloudTrailLogs = await this.getResultS3CloudTrailLakeQuery({
    //   queryId: queryId,
    //   eventDataStoreId: param.eventDataStoreId,
    // });
    // return s3CloudTrailLogs;
    // For now, mock data is as below.
    return [
      {
        releaseId: "abcd-efgh-ijkl-mnop",
        eventTime: "2022-01-01 05:56:40.000",
        sourceIPAddress: "123.123.123.123",
        bucketName: "agha-gdr-elsa-2.0",
        key: "Elsa/20220202/ELSA001.vcf.gz.tbi",
        bytesTransferredOut: 75,
      },
      {
        releaseId: "abcd-efgh-ijkl-mnop",
        eventTime: "2022-01-01 05:51:29.000",
        sourceIPAddress: "123.123.123.123",
        bucketName: "agha-gdr-store-2.0",
        key: "Elsa/20220202/ELS001.bam.bai",
        bytesTransferredOut: 25,
      },
      {
        releaseId: "abcd-efgh-ijkl-mnop",
        eventTime: "2022-01-01 05:56:43.000",
        sourceIPAddress: "123.123.123.123",
        bucketName: "agha-gdr-store-2.0",
        key: "Elsa/20220202/ELS002.vcf.gz",
        bytesTransferredOut: 100,
      },
      {
        releaseId: "abcd-efgh-ijkl-mnop",
        eventTime: "2022-01-01 05:51:30.000",
        sourceIPAddress: "123.123.123.123",
        bucketName: "agha-gdr-store-2.0",
        key: "Elsa/20220202/ELS002.vcf.gz.tbi",
        bytesTransferredOut: 50,
      },
    ];
  }

  // Ideally might be an interval job (perhaps run weekly? or maybe 7days after releaseAudit)
  async recordCloudTrailLogByReleaseId({
    releaseAuditEventId,
  }: {
    releaseAuditEventId: string;
  }) {
    const cloudTrailEventArray = await this.getCloudTrailLakeEvents();

    // Recording this into database
    // Must make this idempotent, perhaps check if auditId has exceed more than 7 days.
    // Make sure with edgedb current time is : timezone in UTC time? or local ec2 region

    for (const trailEvent of cloudTrailEventArray) {
      const s3Url = `s3://${trailEvent.bucketName}/${trailEvent.key}`;
      const utcDate = new Date(`${trailEvent.eventTime} UTC`);

      // Improvement do it in batch?
      await this.auditLogService.updateDataAccessAuditEvent({
        executor: this.edgeDbClient,
        releaseAuditEventId: releaseAuditEventId,
        who: trailEvent.sourceIPAddress,
        fileUrl: s3Url,
        description: "Presigned URL accessed.",
        egressBytes: trailEvent.bytesTransferredOut,
        date: utcDate,
      });
    }
  }
}
