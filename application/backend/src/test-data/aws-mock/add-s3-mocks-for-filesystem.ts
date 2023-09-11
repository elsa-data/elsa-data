import { promises as fs } from "fs";
import { createHash } from "crypto";
import { AwsStub } from "aws-sdk-client-mock";
import {
  GetObjectCommand,
  ListObjectsV2Command,
  ObjectStorageClass,
  ServiceInputTypes,
  ServiceOutputTypes,
  StorageClass,
} from "@aws-sdk/client-s3";
import { Readable } from "stream";
import { sdkStreamMixin } from "@smithy/util-stream";

/**
 * To an existing S3 mock client - we add specific Mock responses that will reflect
 * the content of a real filesystem folder. That is both content (GetObject) and basic list bucket.
 *
 * @param s3MockClient a mock client
 * @param mockBucket a bucket name that will be mocked
 * @param mockKey a bucket key where the files will be mocked to live
 * @param fileRoot the filesystem root to mirror
 */
export async function addMocksForFileSystem(
  s3MockClient: AwsStub<ServiceInputTypes, ServiceOutputTypes>,
  mockBucket: string,
  mockKey: string,
  fileRoot: string
) {
  const filesAll = await getFileEntriesWithContent(fileRoot);

  const fileAsKey = (f: string) => {
    return `${mockKey}/` + f.slice(fileRoot.length + 1);
  };

  s3MockClient
    .on(ListObjectsV2Command, {
      Bucket: mockBucket,
    })
    .resolves({
      ContinuationToken: undefined,
      NextContinuationToken: undefined,
      Contents: filesAll.map((f) => ({
        Key: fileAsKey(f.fileSystemPath),
        LastModified: new Date(), // TBD reflect from filesystem?
        ETag: f.etag,
        Size: f.size,
        StorageClass: ObjectStorageClass.STANDARD,
      })),
    });

  for (const f of filesAll) {
    const rStream = new Readable();

    rStream.push(f.content);
    rStream.push(null);

    s3MockClient
      .on(GetObjectCommand, {
        Bucket: mockBucket,
        Key: fileAsKey(f.fileSystemPath),
      })
      .resolves({
        Body: sdkStreamMixin(rStream),
        ETag: f.etag,
        StorageClass: StorageClass.STANDARD,
      });
  }
}

type FileEntryWithContent = {
  fileSystemPath: string;

  size: number;

  etag: string;

  content: Buffer;
};

/**
 * Recursively build a return array containing the *complete*
 * content of the given directory - including file content
 * and checksums of content.
 *
 * @param dirName the root folder path (should be absolute probably)
 */
const getFileEntriesWithContent = async (
  dirName: string
): Promise<FileEntryWithContent[]> => {
  let files: FileEntryWithContent[] = [];

  const items = await fs.readdir(dirName, { withFileTypes: true });

  for (const item of items) {
    const fullItemPath = `${dirName}/${item.name}`;

    if (item.isDirectory()) {
      files = [...files, ...(await getFileEntriesWithContent(fullItemPath))];
    } else {
      const content = await fs.readFile(fullItemPath, {});

      let hash = createHash("md5").update(content).digest("hex");

      files.push({
        fileSystemPath: `${dirName}/${item.name}`,
        size: content.length,
        etag: hash,
        content: content,
      });
    }
  }

  return files;
};
