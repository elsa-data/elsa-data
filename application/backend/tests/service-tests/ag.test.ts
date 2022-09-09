import { AGService } from "../../src/business/services/ag-service";
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import * as edgedb from "edgedb";
import e, { storage } from "../../dbschema/edgeql-js";
import { container } from "tsyringe";
import { mockClient } from "aws-sdk-client-mock";
import { File } from "../../src/business/db/lab-queries";
import { blankTestData } from "../../src/test-data/blank-test-data";

const MOCK_CARDIAC_S3_OBJECT_LIST = [
  {
    key: "Cardiac/2019-11-21/FILE_L001_R1.fastq.gz",
    eTag: '"ETAG_FASTQ_R1"',
    size: 24791400277,
  },
  {
    key: "Cardiac/2019-11-21/FILE_L001_R2.fastq.gz",
    eTag: '"ETAG_FASTQ_R2"',
    size: 24791400277,
  },
  {
    key: "Cardiac/2019-11-21/manifest.txt",
    eTag: '"ETAG_MANIFEST"',
    size: 24791400277,
  },
];

const MOCK_CARDIAC_MANIFEST =
  `checksum\tfilename\tagha_study_id\n` +
  `CHECKSUM_FASTQ_R2\tFILE_L001_R1.fastq.gz\tA0000001\n` +
  `CHECKSUM_FASTQ_R1\tFILE_L001_R2.fastq.gz\tA0000001\n`;

const MOCK_MANIFEST_OBJECT = [
  {
    checksum: "CHECKSUM_FASTQ_R2",
    filename: "FILE_L001_R1.fastq.gz",
    agha_study_id: "A0000001",
  },
  {
    checksum: "CHECKSUM_FASTQ_R1",
    filename: "FILE_L001_R2.fastq.gz",
    agha_study_id: "A0000001",
  },
];

const MOCK_FASTQ_PAIR_FILE_SET = [
  {
    url: "s3://agha-gdr-store-2.0/Cardiac/2019-11-21/FILE_L001_R1.fastq.gz",
    size: 24791400277,
    checksums: [
      {
        type: storage.ChecksumType.MD5,
        value: "CHECKSUM_FASTQ_R2",
      },
    ],
  },
  {
    url: "s3://agha-gdr-store-2.0/Cardiac/2019-11-21/FILE_L001_R2.fastq.gz",
    size: 24791400277,
    checksums: [
      {
        type: storage.ChecksumType.MD5,
        value: "CHECKSUM_FASTQ_R1",
      },
    ],
  },
];
const MOCK_BAM_FILE_SET = [
  {
    url: "s3://agha-gdr-store-2.0/Cardiac/2019-11-21/A0000001.bam",
    size: 10,
    checksums: [
      {
        type: storage.ChecksumType.MD5,
        value: "BAMCHECKSUM",
      },
    ],
  },
  {
    url: "s3://agha-gdr-store-2.0/Cardiac/2019-11-21/A0000001.bam.bai",
    size: 1,
    checksums: [
      {
        type: storage.ChecksumType.MD5,
        value: "BAICHECKSUM",
      },
    ],
  },
];
const MOCK_S3_LIST_BUCKET_CLIENT = {
  Contents: [
    {
      Key: "Cardiac/2019-11-21/FILE_L001_R1.fastq.gz",
      LastModified: new Date(),
      ETag: '"ETAG_FASTQ_R1"',
      ChecksumAlgorithm: undefined,
      Size: 24791400277,
      StorageClass: "INTELLIGENT_TIERING",
      Owner: undefined,
    },
    {
      Key: "Cardiac/2019-11-21/FILE_L001_R2.fastq.gz",
      LastModified: new Date(),
      ETag: '"ETAG_FASTQ_R2"',
      ChecksumAlgorithm: undefined,
      Size: 24791400277,
      StorageClass: "INTELLIGENT_TIERING",
      Owner: undefined,
    },
    {
      Key: "Cardiac/2019-11-21/manifest.txt",
      LastModified: new Date(),
      ETag: '"ETAG_MANIFEST"',
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

const edgedbClient = edgedb.createClient();
const s3ClientMock = mockClient(S3Client);

describe("AWS s3 client", () => {
  beforeAll(() => {
    container.register<S3Client>("S3Client", {
      useFactory: () => new S3Client({}),
    });
    container.register<edgedb.Client>("Database", {
      useFactory: () => edgedbClient,
    });
  });

  beforeEach(async () => {
    s3ClientMock.reset();
    await blankTestData();
  });

  it("Test getManifestKetFromS3ObjectList", async () => {
    const agService = container.resolve(AGService);
    const manifestObjectList = agService.getManifestKeyFromS3ObjectList(
      MOCK_CARDIAC_S3_OBJECT_LIST
    );
    expect(manifestObjectList).toEqual(["Cardiac/2019-11-21/manifest.txt"]);
  });

  it("Test Convert TSV to JSON", async () => {
    const agService = container.resolve(AGService);
    const jsonManifest = agService.convertTsvToJson(MOCK_CARDIAC_MANIFEST);
    expect(jsonManifest).toEqual(MOCK_MANIFEST_OBJECT);
  });

  it("Test group groupArtifactContent", async () => {
    const agService = container.resolve(AGService);

    const fileRecordListedInManifest: File[] = [
      ...MOCK_FASTQ_PAIR_FILE_SET,
      ...MOCK_BAM_FILE_SET,
    ];

    const groupArtifactContent =
      agService.groupManifestFileByArtifactTypeAndFilename(
        fileRecordListedInManifest
      );
    expect(groupArtifactContent.artifactFastq["FILE_L001"]).toEqual(
      MOCK_FASTQ_PAIR_FILE_SET
    );
    expect(groupArtifactContent.artifactBam["A0000001"]).toEqual(
      MOCK_BAM_FILE_SET
    );
  });

  it("Test queryFileDbFromS3Prefix ", async () => {
    const agService = container.resolve(AGService);
    const s3UrlPrefix = "s3://agha-gdr-store-2.0/Cardiac/2022-01-01/";
    const mockInsertUrl =
      "s3://agha-gdr-store-2.0/Cardiac/2022-01-01/19W001134.bam";

    // Startup
    const insertQuery = e.insert(e.storage.File, {
      url: mockInsertUrl,
      size: 0,
      checksums: [
        {
          type: storage.ChecksumType.MD5,
          value: "abcde",
        },
      ],
    });
    await insertQuery.run(edgedbClient);

    // Test
    const dbResult = await agService.checkDbDifferenceFromManifest(
      s3UrlPrefix,
      MOCK_MANIFEST_OBJECT
    );
    expect(dbResult.missing).toEqual(MOCK_MANIFEST_OBJECT);
  });

  it("Test sync manifest to DB", async () => {
    s3ClientMock.on(ListObjectsV2Command).resolves(MOCK_S3_LIST_BUCKET_CLIENT);
    const agService = container.resolve(AGService);
    jest
      .spyOn(agService, "readFileFromS3Key")
      .mockImplementation(async () => MOCK_CARDIAC_MANIFEST);

    await agService.syncDbFromS3KeyPrefix("Cardiac");

    const queryNewInsertedFile = e.select(e.storage.File, (file) => ({
      url: true,
      filter: e.op(file.url, "ilike", MOCK_FASTQ_PAIR_FILE_SET[0].url),
    }));
    const result = await queryNewInsertedFile.run(edgedbClient);
    expect(result[0].url).toEqual(MOCK_FASTQ_PAIR_FILE_SET[0].url);
  });
});
