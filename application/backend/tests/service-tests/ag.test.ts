import { AGService } from "../../src/business/services/ag-service";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";
import * as edgedb from "edgedb";
import e, { storage } from "../../dbschema/edgeql-js";
import { container } from "tsyringe";
import { mockClient } from "aws-sdk-client-mock";
import {
  File,
  ArtifactType,
  insertArtifactBamQuery,
} from "../../src/business/db/lab-queries";
import { fileByUrlQuery } from "../../src/business/db/storage-queries";
import { blankTestData } from "../../src/test-data/blank-test-data";
import {
  MOCK_DATASET_URI,
  MOCK_BAM_FILE_SET,
  MOCK_FASTQ_PAIR_FILE_SET,
  MOCK_VCF_FILE_SET,
  MOCK_1_CARDIAC_MANIFEST,
  MOCK_1_CARDIAC_S3_OBJECT_LIST,
  MOCK_1_MANIFEST_OBJECT,
  MOCK_1_S3URL_MANIFEST_OBJECT,
  MOCK_1_CARDIAC_FASTQ1_FILENAME,
  MOCK_1_CARDIAC_FASTQ2_FILENAME,
  MOCK_1_STUDY_ID,
  MOCK_2_STUDY_ID,
  MOCK_2_CARDIAC_S3_OBJECT_LIST,
  MOCK_2_CARDIAC_MANIFEST,
  MOCK_2_BAM_FILE_RECORD,
  MOCK_2_BAI_FILE_RECORD,
  MOCK_3_CARDIAC_S3_OBJECT_LIST,
  MOCK_3_CARDIAC_MANIFEST,
} from "./ag.common";
import * as awsHelper from "../../src/business/services/aws-helper";
import {
  getMd5FromChecksumsArray,
  makeSystemlessIdentifierArray,
  makeEmptyIdentifierArray,
} from "../../src/business/db/helper";

const util = require("util");

const edgedbClient = edgedb.createClient();
const s3ClientMock = mockClient(S3Client);

describe("AWS s3 client", () => {
  beforeAll(async () => {
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
    await e
      .insert(e.dataset.Dataset, {
        uri: MOCK_DATASET_URI,
        description: "a mock cardiac test",
        cases: e.insert(e.dataset.DatasetCase, {}),
      })
      .run(edgedbClient);
  });

  afterEach(async () => {
    await blankTestData();
  });

  it("Test getManifestKeyFromS3ObjectList", async () => {
    const agService = container.resolve(AGService);
    const manifestObjectList = agService.getManifestKeyFromS3ObjectList(
      MOCK_1_CARDIAC_S3_OBJECT_LIST
    );
    expect(manifestObjectList).toEqual(["Cardiac/2019-11-21/manifest.txt"]);
  });

  it("Test convertTsvToJson", async () => {
    const agService = container.resolve(AGService);
    const jsonManifest = agService.convertTsvToJson(MOCK_1_CARDIAC_MANIFEST);
    expect(jsonManifest).toEqual(MOCK_1_MANIFEST_OBJECT);
  });

  it("Test groupManifestByStudyId", async () => {
    const agService = container.resolve(AGService);

    const groupArtifactContent = agService.groupManifestByStudyId(
      MOCK_1_S3URL_MANIFEST_OBJECT
    );
    expect(groupArtifactContent["A0000001"]).toEqual(
      MOCK_1_S3URL_MANIFEST_OBJECT
    );
  });

  it("Test groupManifestFileByArtifactTypeAndFilename", async () => {
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

  it("Test updateFileRecordFromManifest", async () => {
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

  it("Test converts3ManifestTypeToFileRecord", async () => {
    const agService = container.resolve(AGService);

    const newFileRec = agService.converts3ManifestTypeToFileRecord(
      MOCK_1_S3URL_MANIFEST_OBJECT,
      MOCK_1_CARDIAC_S3_OBJECT_LIST
    );

    expect(newFileRec[0].size).toBeGreaterThanOrEqual(0);
  });

  it("Test converts3ManifestTypeToFileRecord", async () => {
    const agService = container.resolve(AGService);

    const newFileRec = agService.converts3ManifestTypeToFileRecord(
      MOCK_1_S3URL_MANIFEST_OBJECT,
      MOCK_1_CARDIAC_S3_OBJECT_LIST
    );

    expect(newFileRec[0].size).toBeGreaterThanOrEqual(0);
  });

  it("Test converts3ManifestTypeToFileRecord", async () => {
    const agService = container.resolve(AGService);

    const newFileRec = agService.converts3ManifestTypeToFileRecord(
      MOCK_1_S3URL_MANIFEST_OBJECT,
      MOCK_1_CARDIAC_S3_OBJECT_LIST
    );

    expect(newFileRec[0].size).toBeGreaterThanOrEqual(0);
  });

  it("Test MOCK 1 insert new Cardiac from s3Key", async () => {
    jest
      .spyOn(awsHelper, "awsListObjects")
      .mockImplementation(async () => MOCK_1_CARDIAC_S3_OBJECT_LIST);
    jest
      .spyOn(awsHelper, "readObjectToStringFromS3Key")
      .mockImplementation(async () => MOCK_1_CARDIAC_MANIFEST);

    const agService = container.resolve(AGService);
    await agService.syncDbFromS3KeyPrefix("Cardiac");

    // FILE schema expected values
    const totalFileList = await e
      .select(e.storage.File, () => ({
        url: true,
      }))
      .run(edgedbClient);
    expect(totalFileList.length).toEqual(2);
    const expected = [
      {
        url: `s3://agha-gdr-store-2.0/Cardiac/2019-11-21/${MOCK_1_CARDIAC_FASTQ1_FILENAME}`,
      },
      {
        url: `s3://agha-gdr-store-2.0/Cardiac/2019-11-21/${MOCK_1_CARDIAC_FASTQ2_FILENAME}`,
      },
    ];
    expect(totalFileList).toEqual(expect.arrayContaining(expected));

    const totalDatasetPatent = await e
      .select(e.dataset.DatasetPatient, () => ({
        externalIdentifiers: true,
      }))
      .run(edgedbClient);
    expect(totalDatasetPatent.length).toEqual(1);
    expect(totalDatasetPatent).toEqual([
      { externalIdentifiers: [{ system: "", value: MOCK_1_STUDY_ID }] },
    ]);
  });

  it("Test MOCK 2 Updating Checksum", async () => {
    // Current DB already exist with outdated data
    const bamInsertArtifact = insertArtifactBamQuery(
      MOCK_2_BAM_FILE_RECORD,
      MOCK_2_BAI_FILE_RECORD
    );
    const preExistingData = e.insert(e.dataset.DatasetPatient, {
      externalIdentifiers: makeSystemlessIdentifierArray(MOCK_2_STUDY_ID),
      specimens: e.set(
        e.insert(e.dataset.DatasetSpecimen, {
          externalIdentifiers: makeEmptyIdentifierArray(),
          artifacts: e.set(bamInsertArtifact),
        })
      ),
    });
    const linkDatapatientQuery = e.update(
      e.dataset.DatasetCase,
      (datasetCase) => ({
        set: {
          patients: {
            "+=": preExistingData,
          },
        },
        filter: e.op(datasetCase.dataset.uri, "ilike", MOCK_DATASET_URI),
      })
    );
    await linkDatapatientQuery.run(edgedbClient);

    // MOCK data from S3
    jest
      .spyOn(awsHelper, "awsListObjects")
      .mockImplementation(async () => MOCK_2_CARDIAC_S3_OBJECT_LIST);
    jest
      .spyOn(awsHelper, "readObjectToStringFromS3Key")
      .mockImplementation(async () => MOCK_2_CARDIAC_MANIFEST);
    const agService = container.resolve(AGService);
    await agService.syncDbFromS3KeyPrefix("Cardiac");

    // FILE schema expected values
    const totalFileList = await e
      .select(e.storage.File, () => ({
        url: true,
        checksums: true,
      }))
      .run(edgedbClient);
    expect(totalFileList.length).toEqual(2);
    const expected = [
      {
        url: "s3://agha-gdr-store-2.0/Cardiac/2022-02-22/A0000002.bam",
        checksums: [{ type: "MD5", value: "UPDATED_CHECKSUM" }],
      },
      {
        url: "s3://agha-gdr-store-2.0/Cardiac/2022-02-22/A0000002.bam.bai",
        checksums: [{ type: "MD5", value: "UPDATED_CHECKSUM" }],
      },
    ];
    expect(totalFileList).toEqual(expect.arrayContaining(expected));
  });

  it("Test MOCK 3 Warning to delete data", async () => {
    // Current DB already exist with outdated data
    const bamInsertArtifact = insertArtifactBamQuery(
      MOCK_2_BAM_FILE_RECORD,
      MOCK_2_BAI_FILE_RECORD
    );
    const preExistingData = e.insert(e.dataset.DatasetPatient, {
      externalIdentifiers: makeSystemlessIdentifierArray(MOCK_2_STUDY_ID),
      specimens: e.set(
        e.insert(e.dataset.DatasetSpecimen, {
          externalIdentifiers: makeEmptyIdentifierArray(),
          artifacts: e.set(bamInsertArtifact),
        })
      ),
    });
    const linkDatapatientQuery = e.update(
      e.dataset.DatasetCase,
      (datasetCase) => ({
        set: {
          patients: {
            "+=": preExistingData,
          },
        },
        filter: e.op(datasetCase.dataset.uri, "ilike", MOCK_DATASET_URI),
      })
    );
    await linkDatapatientQuery.run(edgedbClient);

    // MOCK data from S3
    jest
      .spyOn(awsHelper, "awsListObjects")
      .mockImplementation(async () => MOCK_3_CARDIAC_S3_OBJECT_LIST);
    jest
      .spyOn(awsHelper, "readObjectToStringFromS3Key")
      .mockImplementation(async () => MOCK_3_CARDIAC_MANIFEST);
    const consoleText = jest.spyOn(console, "log");

    const agService = container.resolve(AGService);
    await agService.syncDbFromS3KeyPrefix("Cardiac");

    const expected = [
      {
        s3Url: "s3://agha-gdr-store-2.0/Cardiac/2022-02-22/A0000002.bam",
        checksum: "RANDOMCHECKSUM",
        agha_study_id: "A0000002",
      },
      {
        s3Url: "s3://agha-gdr-store-2.0/Cardiac/2022-02-22/A0000002.bam.bai",
        checksum: "RANDOMCHECKSUM",
        agha_study_id: "A0000002",
      },
    ];
    expect(consoleText).toHaveBeenCalledWith(`Data to be deleted: ${expected}`);
  });
});

// console.log(util.inspect(newFileRec, false, 99));
