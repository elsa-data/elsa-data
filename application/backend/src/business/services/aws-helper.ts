import {
  ListObjectsV2Command,
  S3Client,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

/**
 *
 * @param s3Client
 * @param bucketName
 * @param s3KeyPrefix
 * @returns
 */
export type S3ObjectMetadata = {
  key: string;
  eTag: string;
  size: number;
};
export async function awsListObjects(
  s3Client: S3Client,
  bucketName: string,
  s3KeyPrefix: string
): Promise<S3ObjectMetadata[]> {
  let s3ObjectList: S3ObjectMetadata[] = [];
  let continuationToken: string | undefined = undefined;

  do {
    const s3ClientInput: ListObjectsV2Command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: s3KeyPrefix,
      ContinuationToken: continuationToken,
    });
    const listObjOutput = await s3Client.send(s3ClientInput);

    continuationToken = listObjOutput.NextContinuationToken;
    const listContent = listObjOutput.Contents;

    if (listContent) {
      for (const objContent of listContent) {
        const key = objContent.Key;

        s3ObjectList.push({
          key: key ?? "",
          eTag: objContent.ETag ?? "",
          size: objContent.Size ?? 0,
        });
      }
    }
  } while (continuationToken);
  return s3ObjectList;
}

export async function readObjectToStringFromS3Key(
  s3Client: S3Client,
  bucketName: string,
  objectKey: string
): Promise<string> {
  try {
    const s3ClientInput: GetObjectCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
    });
    const getObjOutput = await s3Client.send(s3ClientInput);
    const bodyBuffer = await getObjOutput.Body.toArray();

    return bodyBuffer.toString("utf-8");
  } catch (e) {
    console.error(e);
  }
  return "";
}
