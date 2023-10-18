import * as edgedb from "edgedb";
import { inject, injectable } from "tsyringe";
import {
  CloudTrailClient,
  GetQueryResultsCommand,
  StartQueryCommand,
} from "@aws-sdk/client-cloudtrail";
import { ElsaSettings } from "../../../config/elsa-settings";
import { AwsAccessPointService } from "../sharers/aws-access-point/aws-access-point-service";
import { Logger } from "pino";
import { ReleaseEgressRecords } from "../releases/helpers/release-data-egress-helper";
import { releaseGetAllActivationByReleaseKey } from "../../../../dbschema/queries";

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
  auditId?: string;
};

@injectable()
export class AwsCloudTrailLakeService {
  constructor(
    @inject("Settings") private readonly settings: ElsaSettings,
    @inject("Database") private readonly edgeDbClient: edgedb.Client,
    @inject("Logger") private readonly logger: Logger,
    @inject("CloudTrailClient")
    private readonly cloudTrailClient: CloudTrailClient,
  ) {}

  getEventDataStoreIdFromDatasetUris(
    datasetUris: string[],
  ): string[] | undefined {
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
  /**
   * To find the start of the queryDates, it will be rundown to the nearest date. For example,
   * 27/06/2023 16:22:04 rounded to 27/06/04 00:00:00.
   *
   * As the cost of querying in cloudTrailLake is the interval of days, we might just query all with
   * the same cost.
   *
   * This function will also move back the last query date by one hour as CloudTrailLake event can
   * take 15 minutes or more to appear on the query
   *
   * @param lastQueryDate The last QueryDate from the database
   * @returns
   */
  private findCloudTrailStartTimestamp(lastQueryDate: Date): string {
    lastQueryDate.setHours(lastQueryDate.getHours() - 1);
    lastQueryDate.setHours(0, 0, 0, 0);
    return lastQueryDate.toISOString();
  }

  /**
   * Query and Record from CloudTrailLake API.
   * @param param
   */
  async queryCloudTrailLake({
    sqlQueryStatement,
    eventDataStoreId,
  }: {
    sqlQueryStatement: string;
    eventDataStoreId: string;
  }): Promise<CloudTrailLakeResponseType[]> {
    // Prepare & Send the query
    const command = new StartQueryCommand({
      QueryStatement: sqlQueryStatement,
    });
    const queryResponse = await this.cloudTrailClient.send(command);
    const queryId = queryResponse.QueryId;
    if (!queryId) {
      throw new Error("Unable to create a query");
    }

    // Fetch the result from the sent query
    let nextToken: undefined | string;
    const queryResult: CloudTrailLakeResponseType[] = [];

    // Will query all 'NextToken' result in the query result
    do {
      const command = new GetQueryResultsCommand({
        EventDataStore: eventDataStoreId,
        QueryId: queryId,
        NextToken: nextToken,
      });
      const cloudtrail_query_result_response =
        await this.cloudTrailClient.send(command);
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
   * Create SQL CloudTrailLake statement for PresignedUrl
   * Ref: https://docs.aws.amazon.com/awscloudtrail/latest/userguide/query-limitations.html
   *
   * @param props
   * @returns
   */
  private createSQLQueryByReleaseKeyReqParams(
    props: CloudTrailInputQueryType & { releaseKey: string },
  ): string {
    const requestedField =
      "element_at(requestParameters, 'x-auditId') as auditId, " +
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
  private createSQLQueryByAccessPointArn(
    props: CloudTrailInputQueryType & {
      apArn: string;
    },
  ): string {
    const requestedField =
      "eventTime, " +
      "eventId, " +
      "sourceIPAddress, " +
      "element_at(requestParameters, 'bucketName') as bucketName, " +
      "element_at(requestParameters, 'key') as key, " +
      "element_at(additionalEventData, 'bytesTransferredOut') as bytesTransferredOut";

    const conditionStatement =
      `any_match( resources, r -> ` +
      `r.type = 'AWS::S3::AccessPoint' AND r.arn = '${props.apArn}')`;

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

  protected convertCloudTrailToEgressRecords(props: {
    releaseKey: string;
    description: string;
    c: CloudTrailLakeResponseType;
  }): ReleaseEgressRecords {
    const { releaseKey, description, c } = props;

    const s3Url = `s3://${c.bucketName}/${c.key}`;

    // CloudTrail time always UTC time, adding UTC postfix to make sure recorded properly.
    const utcDate = new Date(`${c.eventTime} UTC`);

    return {
      releaseKey,
      description,
      auditId: c.auditId,
      egressId: c.eventId,

      occurredDateTime: utcDate,
      sourceIpAddress: c.sourceIPAddress,

      egressBytes: parseInt(c.bytesTransferredOut),
      fileUrl: s3Url,
    };
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
  public async getNewEgressRecords({
    releaseKey,
    datasetUrisArray,
    currentDate,
    lastEgressUpdate,
  }: {
    releaseKey: string;
    datasetUrisArray: string[];
    currentDate: Date;
    lastEgressUpdate?: Date;
  }) {
    const egressRecordsResult: ReleaseEgressRecords[] = [];

    const eventDataStoreIds =
      this.getEventDataStoreIdFromDatasetUris(datasetUrisArray);
    if (!eventDataStoreIds) throw new Error("No AWS CloudTrailLake Configured");

    const startQueryDate = lastEgressUpdate
      ? this.findCloudTrailStartTimestamp(lastEgressUpdate)
      : null;

    const endQueryDateISO = currentDate.toISOString();

    for (const edsi of eventDataStoreIds) {
      for (const method of Object.keys(CloudTrailQueryType)) {
        if (method == CloudTrailQueryType.PresignUrl) {
          const sqlQueryStatement = this.createSQLQueryByReleaseKeyReqParams({
            startTimestamp: startQueryDate ?? undefined,
            endTimestamp: endQueryDateISO,
            releaseKey: releaseKey,
            eventDataStoreId: edsi,
          });

          this.logger.debug(
            "CloudTrail PresignedUrl query: ",
            sqlQueryStatement,
          );

          const newCloudTrailRecords = await this.queryCloudTrailLake({
            sqlQueryStatement: sqlQueryStatement,
            eventDataStoreId: edsi,
          });

          for (const nctr of newCloudTrailRecords) {
            egressRecordsResult.push(
              this.convertCloudTrailToEgressRecords({
                releaseKey,
                description: "Accessed via presigned url.",
                c: nctr,
              }),
            );
          }
        } else if (method == CloudTrailQueryType.S3AccessPoint) {
          // Get all s3Alias ever installed from release::Activation
          const allReleaseActivation =
            await releaseGetAllActivationByReleaseKey(this.edgeDbClient, {
              releaseKey: releaseKey,
            });

          for (const a of allReleaseActivation.accessPointArns) {
            const sqlQueryStatement = this.createSQLQueryByAccessPointArn({
              startTimestamp: startQueryDate ?? undefined,
              endTimestamp: endQueryDateISO,
              eventDataStoreId: edsi,
              apArn: a,
            });

            this.logger.debug(
              "CloudTrail AccessPoint SQL Query: ",
              sqlQueryStatement,
            );

            const newCloudTrailRecords = await this.queryCloudTrailLake({
              sqlQueryStatement: sqlQueryStatement,
              eventDataStoreId: edsi,
            });

            for (const nctr of newCloudTrailRecords) {
              egressRecordsResult.push(
                this.convertCloudTrailToEgressRecords({
                  releaseKey,
                  description: "Accessed via S3 access point.",
                  c: nctr,
                }),
              );
            }
          }
        } else {
          this.logger.warn(
            `No matching query type for cloudTrailLake. ('${method}')`,
          );
        }
      }
    }

    return egressRecordsResult;
  }
}
