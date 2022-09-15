import { AGService } from "../../src/business/services/ag-service";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import * as edgedb from "edgedb";
import e, { storage } from "../../dbschema/edgeql-js";
import { container } from "tsyringe";
import { mockClient } from "aws-sdk-client-mock";
import {
  File,
  ArtifactType,
  fileByUrlQuery,
} from "../../src/business/db/lab-queries";
import { blankTestData } from "../../src/test-data/blank-test-data";
import {
  MOCK_CARDIAC_MANIFEST,
  MOCK_S3_LIST_BUCKET_CLIENT,
  MOCK_CARDIAC_S3_OBJECT_LIST,
  MOCK_MANIFEST_OBJECT,
  MOCK_BAM_FILE_SET,
  MOCK_FASTQ_PAIR_FILE_SET,
  MOCK_VCF_FILE_SET,
  MOCK_S3URL_MANIFEST_OBJECT,
} from "./ag.common";
import { getMd5FromChecksumsArray } from "../../src/business/db/helper";

const util = require("util");

const edgedbClient = edgedb.createClient();
const s3ClientMock = mockClient(S3Client);

jest.mock("../../src/business/services/aws-helper", () => ({
  readObjectToStringFromS3Key: async () => MOCK_CARDIAC_MANIFEST,
  awsListObjects: async () => MOCK_CARDIAC_S3_OBJECT_LIST,
}));

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

  it.skip("Test getManifestKeyFromS3ObjectList", async () => {
    const agService = container.resolve(AGService);
    const manifestObjectList = agService.getManifestKeyFromS3ObjectList(
      MOCK_CARDIAC_S3_OBJECT_LIST
    );
    expect(manifestObjectList).toEqual(["Cardiac/2019-11-21/manifest.txt"]);
  });

  it.skip("Test convertTsvToJson", async () => {
    const agService = container.resolve(AGService);
    const jsonManifest = agService.convertTsvToJson(MOCK_CARDIAC_MANIFEST);
    expect(jsonManifest).toEqual(MOCK_MANIFEST_OBJECT);
  });

  it.skip("Test groupManifestByStudyId", async () => {
    const agService = container.resolve(AGService);

    const groupArtifactContent = agService.groupManifestByStudyId(
      MOCK_S3URL_MANIFEST_OBJECT
    );
    expect(groupArtifactContent["A0000001"]).toEqual(
      MOCK_S3URL_MANIFEST_OBJECT
    );
  });

  it.skip("Test groupManifestFileByArtifactTypeAndFilename", async () => {
    const agService = container.resolve(AGService);

    const fileRecordListedInManifest: File[] = [
      ...MOCK_FASTQ_PAIR_FILE_SET,
      ...MOCK_BAM_FILE_SET,
      ...MOCK_VCF_FILE_SET,
    ];
    const groupArtifactContent =
      agService.groupManifestFileByArtifactTypeAndFilename(
        fileRecordListedInManifest
      );
    expect(groupArtifactContent[ArtifactType.FASTQ]["FILE_L001"]).toEqual(
      MOCK_FASTQ_PAIR_FILE_SET
    );
    expect(groupArtifactContent[ArtifactType.BAM]["A0000001.bam"]).toEqual(
      MOCK_BAM_FILE_SET
    );
    expect(
      groupArtifactContent[ArtifactType.VCF]["19W001062.individual.norm.vcf"]
    ).toEqual(MOCK_VCF_FILE_SET);
  });

  it.skip("Test updateFileRecordFromManifest", async () => {
    const agService = container.resolve(AGService);

    const mockInsertUrl = "s3://bucket/FILE_L001_R1.fastq.gz";
    const newManifestContent = {
      checksums: [
        {
          type: storage.ChecksumType.MD5,
          value: "UPDATED_CHECKSUM",
        },
      ],
      url: mockInsertUrl,
      size: 0,
    };

    // Startup
    const insertQuery = e.insert(e.storage.File, {
      url: mockInsertUrl,
      size: 0,
      checksums: [
        {
          type: storage.ChecksumType.MD5,
          value: "OLD_CHECKSUM",
        },
        {
          type: storage.ChecksumType.AWS_ETAG,
          value: "AWS_ETAG",
        },
      ],
    });
    await insertQuery.run(edgedbClient);

    await agService.updateFileRecordFromManifest(newManifestContent);

    // Query For the New Change
    const newFileRec = await fileByUrlQuery.run(edgedbClient, {
      url: mockInsertUrl,
    });

    const newMd5Checksum = getMd5FromChecksumsArray(
      newFileRec[0]?.checksums ?? []
    );
    expect(newMd5Checksum).toEqual("UPDATED_CHECKSUM");
  });

  it("Test insertNewArtifact", async () => {
    const agService = container.resolve(AGService);
    const dataToInsert = {
      FASTQ: { FQFILENAMEID: MOCK_FASTQ_PAIR_FILE_SET },
      BAM: { BAMFILENAMEID: MOCK_BAM_FILE_SET },
      VCF: { VCFFILENAMEID: MOCK_VCF_FILE_SET },
    };

    const insArtifactQueryList =
      agService.insertNewArtifactListQuery(dataToInsert);

    for (const insQuery of insArtifactQueryList) {
      await insQuery.run(edgedbClient);
    }

    const artifactBaseList = await e
      .select(e.lab.ArtifactBase, () => ({
        id: true,
      }))
      .run(edgedbClient);
    expect(artifactBaseList.length).toEqual(3);

    const fileList = await e
      .select(e.storage.File, () => ({
        id: true,
      }))
      .run(edgedbClient);
    expect(fileList.length).toEqual(6);
  });

  it.skip("Test converts3ManifestTypeToFileRecord", async () => {
    const agService = container.resolve(AGService);

    const newFileRec = agService.converts3ManifestTypeToFileRecord(
      MOCK_S3URL_MANIFEST_OBJECT,
      MOCK_CARDIAC_S3_OBJECT_LIST
    );

    expect(newFileRec[0].size).toBeGreaterThanOrEqual(0);
  });

  it.skip("Test converts3ManifestTypeToFileRecord", async () => {
    const agService = container.resolve(AGService);

    const newFileRec = agService.converts3ManifestTypeToFileRecord(
      MOCK_S3URL_MANIFEST_OBJECT,
      MOCK_CARDIAC_S3_OBJECT_LIST
    );

    expect(newFileRec[0].size).toBeGreaterThanOrEqual(0);
  });

  it.skip("Test converts3ManifestTypeToFileRecord", async () => {
    const agService = container.resolve(AGService);

    const newFileRec = agService.converts3ManifestTypeToFileRecord(
      MOCK_S3URL_MANIFEST_OBJECT,
      MOCK_CARDIAC_S3_OBJECT_LIST
    );

    expect(newFileRec[0].size).toBeGreaterThanOrEqual(0);
  });

  it("Test sync manifest to DB", async () => {
    const agService = container.resolve(AGService);

    await agService.syncDbFromS3KeyPrefix("Cardiac");
  });
});

// console.log(util.inspect(newFileRec, false, 99));
