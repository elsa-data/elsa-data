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
import { Readable } from "stream";
import { promises as fs } from "fs";
import { sdkStreamMixin } from "@aws-sdk/util-stream-node";

export const MM_URI = "urn:fdc:umccr.org:2022:dataset/mm";

/**
 * The MM dataset is mini mitochondrial data
 */
export async function insertMM(dc: DependencyContainer): Promise<string> {
  const { edgeDbClient } = getServices(dc);

  const tenc = await e
    .insert(e.dataset.Dataset, {
      uri: MM_URI,
      externalIdentifiers: makeSystemlessIdentifierArray("MM"),
      description: "MM",
      cases: e.set(),
    })
    .run(edgeDbClient);

  return MM_URI;
}

const { readdir } = require("fs").promises;

const getFileList = async (dirName: string) => {
  let files: string[] = [];
  const items = await readdir(dirName, { withFileTypes: true });

  for (const item of items) {
    if (item.isDirectory()) {
      files = [...files, ...(await getFileList(`${dirName}/${item.name}`))];
    } else {
      files.push(`${dirName}/${item.name}`);
    }
  }

  return files;
};

export async function addMocksForFileSystem(
  s3MockClient: AwsStub<ServiceInputTypes, ServiceOutputTypes>,
  mockBucket: string,
  fileRoot: string
) {
  const filesAll = await getFileList(fileRoot);

  const fileAsKey = (f: string) => {
    return "MM/" + f.slice(fileRoot.length + 1);
  };

  s3MockClient
    .on(ListObjectsV2Command, {
      Bucket: mockBucket,
    })
    .resolves({
      ContinuationToken: undefined,
      NextContinuationToken: undefined,
      Contents: filesAll.map((f) => ({
        Key: fileAsKey(f),
        LastModified: new Date(),
        ETag: "abcd",
        // ChecksumAlgorithm?: (ChecksumAlgorithm | string)[];
        Size: 123,
        StorageClass: ObjectStorageClass.STANDARD,
      })),
    });

  for (const f of filesAll) {
    const data = await fs.readFile(f, "binary");

    const rStream = new Readable();

    rStream.push(data);
    rStream.push(null);

    s3MockClient
      .on(GetObjectCommand, {
        Bucket: mockBucket,
        Key: fileAsKey(f),
      })
      .resolves({
        Body: sdkStreamMixin(rStream),
        ETag: "abcd",
        StorageClass: StorageClass.STANDARD,
      });
  }
}
