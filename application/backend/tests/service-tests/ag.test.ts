import { AGService } from "../../src/business/services/ag-service";
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import * as edgedb from "edgedb";
import { container } from "tsyringe";
import { mockClient } from "aws-sdk-client-mock";

const MOCK_CARDIAC_OBJECT_LIST = {
  $metadata: {
    httpStatusCode: 200,
    requestId: undefined,
    extendedRequestId: "XXX/=",
    cfId: undefined,
    attempts: 1,
    totalRetryDelay: 0,
  },
  CommonPrefixes: undefined,
  Contents: [
    {
      Key: "Cardiac/2019-11-21/FILE_1.fastq.gz",
      LastModified: new Date(),
      ETag: '"686897696a7c876b7e001"',
      ChecksumAlgorithm: undefined,
      Size: 24791400277,
      StorageClass: "INTELLIGENT_TIERING",
      Owner: undefined,
    },
    {
      Key: "Cardiac/2019-11-21/FILE_2.fastq.gz",
      LastModified: new Date(),
      ETag: '"686897696a7c876b7e002"',
      ChecksumAlgorithm: undefined,
      Size: 24791400277,
      StorageClass: "INTELLIGENT_TIERING",
      Owner: undefined,
    },
    {
      Key: "Cardiac/2019-11-21/manifest.txt",
      LastModified: new Date(),
      ETag: '"686897696a7c876b7e003"',
      ChecksumAlgorithm: undefined,
      Size: 24791400277,
      StorageClass: "INTELLIGENT_TIERING",
      Owner: undefined,
    },
  ],
  ContinuationToken: undefined,
  Delimiter: undefined,
  EncodingType: undefined,
  IsTruncated: false,
  KeyCount: 3,
  MaxKeys: 1000,
  Name: "agha-gdr-store-2.0",
  NextContinuationToken: undefined,
  Prefix: "Cardiac",
  StartAfter: undefined,
};

const MOCK_CARDIAC_MANIFEST =
  `checksum\tfilename\tagha_study_id\n` +
  `d3c7a143235748ae4c655ffa06636f5b\tFILE_1_L002_R1.fastq.gz\tA0000001\n` +
  `c0362446078f0d02dbd8862d06bb1838\tFILE_1_L002_R2.fastq.gz\tA0000001\n`;

const MOCK_MANIFEST_OBJECT = [
  {
    checksum: "d3c7a143235748ae4c655ffa06636f5b",
    filename: "FILE_1_L002_R1.fastq.gz",
    agha_study_id: "A0000001",
  },
  {
    checksum: "c0362446078f0d02dbd8862d06bb1838",
    filename: "FILE_1_L002_R2.fastq.gz",
    agha_study_id: "A0000001",
  },
];

// const s3ClientMock = mockClient(S3Client);

describe("AWS s3 client", () => {
  beforeAll(() => {
    container.register<S3Client>("S3Client", {
      useFactory: () => new S3Client({}),
    });
    container.register<edgedb.Client>("Database", {
      useFactory: () => edgedb.createClient(),
    });
  });

  beforeEach(() => {
    // s3ClientMock.reset();
  });

  it.skip("Test list manifest key from key prefix", async () => {
    // s3ClientMock.on(ListObjectsV2Command).resolves(MOCK_CARDIAC_OBJECT_LIST);

    const agService = container.resolve(AGService);

    const manifestObjectList = await agService.getManifestListFromS3KeyPrefix(
      "Cardiac"
    );

    expect(manifestObjectList).toEqual([
      {
        Key: "Cardiac/2019-11-21/manifest.txt",
        ETag: '"686897696a7c876b7e003"',
        Size: 24791400277,
      },
    ]);
  });

  it.skip("Test Convert TSV to JSON", async () => {
    const agService = container.resolve(AGService);

    const manifestString = agService.convertTsvToJson(MOCK_CARDIAC_MANIFEST);
    console.log(manifestString);

    // expect(manifestString).toEqual(MOCK_CARDIAC_MANIFEST);
  });

  it.skip("Test read manifest", async () => {
    // s3ClientMock.on(GetObjectCommand).resolves({});

    const agService = container.resolve(AGService);

    const manifestString = await agService.readFileFromS3Key(
      "Cardiac/2019-11-21/manifest.txt"
    );

    console.log(manifestString);
    console.log(manifestString?.split("\t"));
    // expect(manifestString).toEqual(MOCK_CARDIAC_MANIFEST);
  });

  it.skip("Test group files by artifact type function", async () => {
    const agService = container.resolve(AGService);

    const groupArtifactContent =
      agService.groupManifestFileByArtifactType(MOCK_MANIFEST_OBJECT);
    expect(groupArtifactContent.artifactFastq["FILE_1_L002"]).toEqual(
      MOCK_MANIFEST_OBJECT
    );
  });
});
