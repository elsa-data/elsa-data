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
import { sdkStreamMixin } from "@aws-sdk/util-stream-node";

export type AustralianGenomicsDirectoryStructureObject = {
  // the path of the object *within the overall dataset*.. i.e. "2010-01/mybam.bam"
  path: string;
  etag: string;
  size: number;
};

export type AustralianGenomicsDirectoryStructure = {
  files: AustralianGenomicsDirectoryStructureObject[];

  // the file content for the manifests indexed by 'path'
  fileContent: {
    [f: string]: string;
  };
};

/**
 * To an existing S3 mock client - we add specific mock responses for an already
 * in memory description of the directory structure.
 *
 * @param s3MockClient a mock client
 * @param mockBucket a bucket name that will be mocked
 * @param mockKey a bucket key where the files will be mocked to live
 * @param directoryStructure the directory structure objects in memory
 */
export async function addMocksForInMemory(
  s3MockClient: AwsStub<ServiceInputTypes, ServiceOutputTypes>,
  mockBucket: string,
  mockKey: string,
  directoryStructure: AustralianGenomicsDirectoryStructure
) {
  const fileAsKey = (f: string) => {
    return `${mockKey}/${f}`;
  };

  s3MockClient
    .on(ListObjectsV2Command, {
      Bucket: mockBucket,
    })
    .resolves({
      ContinuationToken: undefined,
      NextContinuationToken: undefined,
      Contents: directoryStructure.files.map((f) => ({
        Key: fileAsKey(f.path),
        LastModified: new Date(),
        ETag: f.etag,
        Size: f.size,
        StorageClass: ObjectStorageClass.STANDARD,
      })),
    });

  for (const f of directoryStructure.files) {
    const rStream = new Readable();

    rStream.push(directoryStructure.fileContent[f.path]);
    rStream.push(null);

    s3MockClient
      .on(GetObjectCommand, {
        Bucket: mockBucket,
        Key: fileAsKey(f.path),
      })
      .resolves({
        Body: sdkStreamMixin(rStream),
        ETag: f.etag,
        StorageClass: StorageClass.STANDARD,
      });
  }
}
