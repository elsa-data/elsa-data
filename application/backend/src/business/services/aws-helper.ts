import {
  ListObjectsV2Command,
  S3Client,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { Readable } from "stream";

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
    // https://transang.me/modern-fetch-and-how-to-get-buffer-output-from-aws-sdk-v3-getobjectcommand/
    const getObjOutput = await s3Client.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
      })
    );
    if (getObjOutput.Body) {
      const stream = getObjOutput.Body as Readable;
      // the NodeJs typescript defs for Readable haven't caught up with the toArray() method (Nodejs 17+)
      const asBuffer = Buffer.concat(await (stream as any).toArray());

      return asBuffer.toString("utf-8");
    }
  } catch (e) {
    console.error(e);
  }
  return "";
}
