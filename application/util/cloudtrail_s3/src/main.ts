import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";
import {
  CloudTrailClient,
  StartQueryCommand,
  GetQueryResultsCommand,
} from "@aws-sdk/client-cloudtrail";

/**
 * AWS Client
 */
const CONFIG = {};
const CLOUDTRAIL_CLIENT = new CloudTrailClient(CONFIG);
const S3_CLIENT = new S3Client(CONFIG);

/**
 * Getting logs from cloudtrail query
 */
type CloudTrailInputQueryType = {
  eventDataStoreId: string;
  awsAccessKeyId: string;
  s3KeyObject?: string;
  startTimestamp?: string /* Unix time in 'YYYY-DD-MM 00:00:00.000', example: '2022-07-05 22:00:00.000' */;
  endTimestamp?: string /* Unix time in 'YYYY-DD-MM 00:00:00.000', example: '2022-07-05 23:00:00.000' */;
};
async function requestS3CloudTrailLakeQuery(
  props: CloudTrailInputQueryType
): Promise<string> {
  // Ref: https://docs.aws.amazon.com/awscloudtrail/latest/userguide/query-limitations.html
  const requestedField =
    "userIdentity.accessKeyId, " +
    "eventTime, " +
    "sourceIPAddress, " +
    "element_at(requestParameters, 'bucketName') as bucketName, " +
    "element_at(requestParameters, 'key') as key, " +
    "element_at(additionalEventData, 'bytesTransferredOut') as bytesTransferredOut";

  let sqlStatement =
    `SELECT ${requestedField} FROM ${props.eventDataStoreId} ` +
    `WHERE userIdentity.accessKeyId='${props.awsAccessKeyId}' `;

  // Additional filter
  if (props.startTimestamp)
    sqlStatement += `AND eventtime > '${props.startTimestamp}'`;
  if (props.endTimestamp)
    sqlStatement += `AND eventtime < '${props.endTimestamp}'`;
  if (props.s3KeyObject)
    sqlStatement +=
      `AND element_at(requestParameters, 'key') = '${props.s3KeyObject}'`;

  // Sending request to query
  const command = new StartQueryCommand({ QueryStatement: sqlStatement });
  const queryResponse = await CLOUDTRAIL_CLIENT.send(command);
  const queryId = queryResponse.QueryId;
  if (queryId) {
    return queryId;
  } else {
    throw new Error("Unable to create a query");
  }
}

type CloudTrailGetQueryResultParam = {
  queryId: string;
  eventDataStoreId: string;
};
async function getResultS3CloudTrailLakeQuery(
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
    const cloudtrail_query_result_response = await CLOUDTRAIL_CLIENT.send(
      command
    );

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

/**
 * Getting S3 object metadata (Take size)
 */
type S3ObjectLocationType = {
  bucketName: string;
  key: string;
};
async function getS3ObjectSize(params: S3ObjectLocationType): Promise<number> {
  const command = new HeadObjectCommand({
    Bucket: params.bucketName,
    Key: params.key,
  });
  const objectMetadata = await S3_CLIENT.send(command);

  const objectSize = objectMetadata.ContentLength;
  return objectSize;
}

type logsType = Record<string, string | number>;

async function addS3MetadataToCloudTrailS3Logs(
  s3CloudTrailLogs: Record<string, string>[]
): Promise<logsType[]> {
  const logsResult = [];
  /* Grab S3 object information and append to metadata */
  for (const log of s3CloudTrailLogs) {
    const objectSize = await getS3ObjectSize({
      bucketName: log.bucketName,
      key: log.key,
    });

    const temp = {
      accesskeyid: log.accesskeyid,
      eventTime: log.eventTime,
      sourceIPAddress: log.sourceIPAddress,
      bucketName: log.bucketName,
      key: log.key,
      bytesTransferredOut: parseFloat(log.bytesTransferredOut),
      s3ObjectSize: objectSize,
    };

    logsResult.push(temp);
  }

  return logsResult;
}

function sortString(a: logsType, b: logsType, column: string) {
  if (a[column] < b[column]) return -1;
  if (a[column] > b[column]) return 1;
  return 0;
}

function sumEgressBytes(logs: logsType[]) {
  let count: number = 0;
  for (const log of logs) {
    const { bytesTransferredOut } = log;

    if (typeof bytesTransferredOut === "string") {
      count += parseFloat(bytesTransferredOut);
    } else {
      count += bytesTransferredOut;
    }
  }
  return count;
}
function displayStatsFromS3Logs(logsType: logsType[]) {
  // Displaying raw logs from cloudtrail
  console.log("Raw logs");
  console.table(logsType);

  // Grouping logs based on keys
  const resultStat = [];
  type groupedType = Record<string, Record<string, string | number>[]>;
  const groupedByKey = logsType.reduce((group: groupedType, log) => {
    const { key } = log;
    group[key] = group[key] ?? [];
    group[key].push(log);
    return group;
  }, {});

  for (const key in groupedByKey) {
    const keyLogs = groupedByKey[key];

    // Last event
    const sortedEvent = keyLogs.sort((a, b) => sortString(a, b, "eventTime"));
    const lastEvent = sortedEvent.at(sortedEvent.length - 1);

    const result = {};
    result["bucketName"] = lastEvent.bucketName;
    result["key"] = key;
    result["accessKeyId"] = lastEvent.accesskeyid;
    result["lastIpRequest"] =
      lastEvent.sourceIPAddress; /* Ext: could use external API to search location */
    result["lastDownload"] = lastEvent.eventTime;
    result["objectSizeBytes"] = lastEvent.s3ObjectSize;

    // Total ObjectSize egress
    result["totalEgressBytes"] = sumEgressBytes(keyLogs);

    // Download status
    let downloadStatus: string;
    if (result["totalEgressBytes"] == result["objectSizeBytes"]) {
      downloadStatus = "completed";
    } else if (result["totalEgressBytes"] < result["objectSizeBytes"]) {
      downloadStatus = "incomplete";
    } else if (result["totalEgressBytes"] > result["objectSizeBytes"]) {
      downloadStatus = "multiple-download";
    } else {
      downloadStatus = "-";
    }
    result["downloadStatus"] = downloadStatus;

    resultStat.push(result);
  }
  console.log("Group by s3Keys");
  console.table(resultStat);
}

async function main(param) {
  /* Grab logs from CloudTrail */
  const queryId = await requestS3CloudTrailLakeQuery(param);
  const s3CloudTrailLogs = await getResultS3CloudTrailLakeQuery({
    queryId: queryId,
    eventDataStoreId: param.eventDataStoreId,
  });

  /** Printing log result in a table */
  const logsResult = await addS3MetadataToCloudTrailS3Logs(s3CloudTrailLogs);
  displayStatsFromS3Logs(logsResult);
}

const CONST_PARAMETER: CloudTrailInputQueryType = {
...
};

main(CONST_PARAMETER);
