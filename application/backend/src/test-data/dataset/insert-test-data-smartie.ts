import e from "../../../dbschema/edgeql-js";
import { DependencyContainer } from "tsyringe";
import { getServices } from "../../di-helpers";
import { makeSystemlessIdentifierArray } from "../util/test-data-helpers";
import { AwsStub } from "aws-sdk-client-mock";
import {
  GetObjectCommand,
  ListObjectsV2Command,
  ObjectStorageClass,
  ServiceInputTypes,
  ServiceOutputTypes,
  StorageClass,
} from "@aws-sdk/client-s3";
import { promises as fs } from "fs";
import { sdkStreamMixin } from "@aws-sdk/util-stream-node";
import { createHash } from "crypto";
import { Readable } from "stream";

export const SMARTIE_URI = "urn:example:elsa-data-demo-dataset-smartie";

/**
 * The Smartie dataset is mini and mitochondrial data
 */
export async function insertSmartie(dc: DependencyContainer): Promise<string> {
  const { edgeDbClient } = getServices(dc);

  const tenc = await e
    .insert(e.dataset.Dataset, {
      uri: SMARTIE_URI,
      externalIdentifiers: makeSystemlessIdentifierArray("Smartie"),
      description: "Smartie",
      cases: e.set(),
    })
    .run(edgeDbClient);

  return SMARTIE_URI;
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

export async function addMocksForFileSystem(
  s3MockClient: AwsStub<ServiceInputTypes, ServiceOutputTypes>,
  mockBucket: string,
  fileRoot: string
) {
  const filesAll = await getFileEntriesWithContent(fileRoot);

  const fileAsKey = (f: string) => {
    return "Smartie/" + f.slice(fileRoot.length + 1);
  };

  s3MockClient.onAnyCommand().rejects("All calls to S3 need to be mocked");

  s3MockClient
    .on(ListObjectsV2Command, {
      Bucket: mockBucket,
    })
    .resolves({
      ContinuationToken: undefined,
      NextContinuationToken: undefined,
      Contents: filesAll.map((f) => ({
        Key: fileAsKey(f.fileSystemPath),
        LastModified: new Date(),
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
