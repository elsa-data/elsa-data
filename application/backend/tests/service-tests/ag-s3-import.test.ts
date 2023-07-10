import {
  S3IndexApplicationService,
  FileGroupType,
} from "../../src/business/services/australian-genomics/s3-index-import-service";
import { S3Client } from "@aws-sdk/client-s3";
import * as edgedb from "edgedb";
import e from "../../dbschema/edgeql-js";
import { mockClient } from "aws-sdk-client-mock";
import {
  File,
  ArtifactEnum,
  insertArtifactBamQuery,
} from "../../src/business/db/lab-queries";
import { fileByUrlQuery } from "../../src/business/db/storage-queries";
import { blankTestData } from "../../src/test-data/util/blank-test-data";
import {
  S3_URL_PREFIX,
  MOCK_STORAGE_PREFIX_URL,
  MOCK_DATASET_URI,
  MOCK_FASTQ_FORWARD_MERGE_MANIFEST,
  MOCK_FASTQ_REVERSE_MERGE_MANIFEST,
  MOCK_BAM_MERGE_MANIFEST,
  MOCK_BAI_MERGE_MANIFEST,
  MOCK_VCF_MERGE_MANIFEST,
  MOCK_TBI_MERGE_MANIFEST,
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
  MOCK_4_CARDIAC_MANIFEST,
  MOCK_4_CARDIAC_S3_OBJECT_LIST,
  MOCK_4_STUDY_ID_3,
  MOCK_4_STUDY_ID_2,
  MOCK_4_STUDY_ID_1,
  MOCK_4_CARDIAC_VCF_FILENAME,
} from "./ag.common";
import * as awsHelper from "../../src/business/services/aws/aws-helper";
import {
  getMd5FromChecksumsArray,
  makeSystemlessIdentifierArray,
  makeEmptyIdentifierArray,
} from "../../src/business/db/helper";
import { registerTypes } from "../test-dependency-injection.common";
import { DatasetService } from "../../src/business/services/dataset-service";
import { storage } from "../../dbschema/interfaces";
import { AuthenticatedUser } from "../../src/business/authenticated-user";
import { beforeEachCommon } from "./user.common";

const testContainer = registerTypes();

const s3ClientMock = mockClient(S3Client);
let edgedbClient: edgedb.Client;
let user: AuthenticatedUser;

jest.mock("../../src/business/services/aws/aws-helper", () => ({
  __esModule: true,
  ...jest.requireActual("../../src/business/services/aws/aws-helper"),
}));

type ExternalIdentifiersType = {
  externalIdentifiers: { system: string; value: string }[] | null;
};
const sortFirstExternalId = (
  arr: ExternalIdentifiersType[]
): ExternalIdentifiersType[] => {
  return arr.sort((a, b) => {
    if (a.externalIdentifiers === null) {
      return 1;
    }
    if (b.externalIdentifiers === null) {
      return -1;
    }
    return a.externalIdentifiers[0].value > b.externalIdentifiers[0].value
      ? 1
      : -1;
  });
};

describe("AWS s3 client", () => {
  beforeAll(async () => {});

  beforeEach(async () => {
    s3ClientMock.reset();

    ({ existingUser: user, edgeDbClient: edgedbClient } =
      await beforeEachCommon());
  });

  afterEach(async () => {
    await blankTestData();
  });

  it("Test getManifestKeyFromS3ObjectList", async () => {
    const agService = testContainer.resolve(S3IndexApplicationService);
    const manifestObjectList = agService.getManifestUriFromS3ObjectList(
      MOCK_1_CARDIAC_S3_OBJECT_LIST
    );
    expect(manifestObjectList).toEqual([
      `${MOCK_STORAGE_PREFIX_URL}/2019-11-21/manifest.txt`,
    ]);
  });

  it("Test convertTsvToJson", async () => {
    const agService = testContainer.resolve(S3IndexApplicationService);
    const jsonManifest = agService.convertTsvToJson(MOCK_1_CARDIAC_MANIFEST);
    expect(jsonManifest).toEqual(MOCK_1_MANIFEST_OBJECT);
  });

  it("Test updateFileRecordFromManifest", async () => {
    const agService = testContainer.resolve(S3IndexApplicationService);

    const mockInsertUrl = "s3://bucket/FILE_L001_R1.fastq.gz";
    const newManifestContent = {
      checksums: [
        {
          type: "MD5" as storage.ChecksumType,
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
          type: "MD5",
          value: "OLD_CHECKSUM",
        },
        {
          type: "AWS_ETAG",
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
      newFileRec?.checksums ?? []
    );
    expect(newMd5Checksum).toEqual("UPDATED_CHECKSUM");
  });

  it("Test updateUnavailableFileRecord", async () => {
    const agService = testContainer.resolve(S3IndexApplicationService);

    const mockInsertUrl = "s3://bucket/FILE_L001_R1.fastq.gz";

    // Startup
    const insertQuery = e.insert(e.storage.File, {
      url: mockInsertUrl,
      size: 0,
      checksums: [
        {
          type: "MD5",
          value: "OLD_CHECKSUM",
        },
      ],
      isDeleted: false,
    });
    await insertQuery.run(edgedbClient);

    await agService.updateUnavailableFileRecord(mockInsertUrl);

    // Query For the New Change
    const newFileRec = await fileByUrlQuery.run(edgedbClient, {
      url: mockInsertUrl,
    });

    const newIsAvailable = newFileRec?.isDeleted;
    expect(newIsAvailable).toEqual(true);
  });

  it("Test insertArtifact", async () => {
    const agService = testContainer.resolve(S3IndexApplicationService);
    const dataToInsert: FileGroupType[] = [
      {
        filetype: ArtifactEnum.FASTQ,
        filenameId: MOCK_FASTQ_FORWARD_MERGE_MANIFEST.s3Url,
        specimenId: "L001",
        patientIdArray: ["ID001"],
        file: [
          MOCK_FASTQ_FORWARD_MERGE_MANIFEST,
          MOCK_FASTQ_REVERSE_MERGE_MANIFEST,
        ],
      },
      {
        filetype: ArtifactEnum.BAM,
        filenameId: MOCK_BAM_MERGE_MANIFEST.s3Url,
        specimenId: "L002",
        patientIdArray: ["ID002"],
        file: [MOCK_BAM_MERGE_MANIFEST, MOCK_BAI_MERGE_MANIFEST],
      },
      {
        filetype: ArtifactEnum.VCF,
        filenameId: MOCK_VCF_MERGE_MANIFEST.s3Url,
        specimenId: "L003",
        patientIdArray: ["ID003"],
        file: [MOCK_VCF_MERGE_MANIFEST, MOCK_TBI_MERGE_MANIFEST],
      },
    ];

    for (const i in dataToInsert) {
      const insertQuery = agService.insertArtifact(dataToInsert[i]);
      if (insertQuery) await insertQuery.run(edgedbClient);
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
    const agService = testContainer.resolve(S3IndexApplicationService);

    const artRec = agService.converts3ManifestTypeToArtifactTypeRecord(
      MOCK_1_S3URL_MANIFEST_OBJECT,
      MOCK_1_CARDIAC_S3_OBJECT_LIST
    );

    expect(artRec[0].size).toBeGreaterThanOrEqual(0);
  });

  it("Test linkPedigreeRelationship", async () => {
    const DATA_CASE_ID = "FAM0001";
    const agService = testContainer.resolve(S3IndexApplicationService);

    // Mock Data
    const pedigreeIdList = [
      {
        probandId: "A000001",
        patientId: "A000001",
        datasetCaseId: DATA_CASE_ID,
      },
      {
        probandId: "A000001",
        patientId: "A000001_pat",
        datasetCaseId: DATA_CASE_ID,
      },
      {
        probandId: "A000001",
        patientId: "A000001_mat",
        datasetCaseId: DATA_CASE_ID,
      },
    ];

    // Pre-insert DataCaseId
    const preInsertDataQuery = e.insert(e.dataset.Dataset, {
      uri: MOCK_DATASET_URI,
      description: "UMCCR 10F",
      cases: e.insert(e.dataset.DatasetCase, {
        externalIdentifiers: makeSystemlessIdentifierArray(DATA_CASE_ID),
        patients: e.set(
          ...pedigreeIdList.map((p) =>
            e.insert(e.dataset.DatasetPatient, {
              externalIdentifiers: makeSystemlessIdentifierArray(p.patientId),
            })
          )
        ),
      }),
    });
    await preInsertDataQuery.run(edgedbClient);
    await agService.linkPedigreeRelationship(MOCK_DATASET_URI, pedigreeIdList);

    const pedigreeQuery = e.select(e.pedigree.Pedigree, () => ({}));
    const pedigreeArray = await pedigreeQuery.run(edgedbClient);
    expect(pedigreeArray.length).toEqual(1);

    const pedigreeRQuery = e.select(
      e.pedigree.PedigreeRelationship,
      () => ({})
    );
    const pedigreeRelationshipArray = await pedigreeRQuery.run(edgedbClient);
    expect(pedigreeRelationshipArray.length).toEqual(2);
  });

  it("Test MOCK 1 insert new Cardiac from s3Key", async () => {
    const agService = testContainer.resolve(S3IndexApplicationService);
    const datasetService = testContainer.resolve(DatasetService);
    await datasetService.selectOrInsertDataset({
      datasetUri: MOCK_DATASET_URI,
      datasetName: "Cardiac",
      datasetDescription: "A test flagship",
    });
    jest
      .spyOn(awsHelper, "awsListObjects")
      .mockImplementation(async () => MOCK_1_CARDIAC_S3_OBJECT_LIST);
    jest
      .spyOn(awsHelper, "readObjectToStringFromS3Url")
      .mockImplementation(async () => MOCK_1_CARDIAC_MANIFEST);

    await agService.syncWithDatabaseFromDatasetUri(
      MOCK_DATASET_URI,
      user,
      "australian-genomics-directories"
    );

    // FILE schema expected values
    const totalFileList = await e
      .select(e.storage.File, () => ({
        url: true,
      }))
      .run(edgedbClient);
    expect(totalFileList.length).toEqual(2);
    const expected = [
      {
        url: `${S3_URL_PREFIX}/${MOCK_1_CARDIAC_FASTQ1_FILENAME}`,
      },
      {
        url: `${S3_URL_PREFIX}/${MOCK_1_CARDIAC_FASTQ2_FILENAME}`,
      },
    ];
    expect(totalFileList).toEqual(expect.arrayContaining(expected));

    const totalDatasetPatient = await e
      .select(e.dataset.DatasetPatient, () => ({
        externalIdentifiers: true,
      }))
      .run(edgedbClient);
    expect(totalDatasetPatient.length).toEqual(1);
    expect(totalDatasetPatient).toEqual([
      { externalIdentifiers: [{ system: "", value: MOCK_1_STUDY_ID }] },
    ]);
  });

  it("Test MOCK 2 Updating Checksum", async () => {
    const agService = testContainer.resolve(S3IndexApplicationService);
    const datasetService = testContainer.resolve(DatasetService);
    await datasetService.selectOrInsertDataset({
      datasetUri: MOCK_DATASET_URI,
      datasetName: "Cardiac",
      datasetDescription: "A test Flagship",
    });
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
      .spyOn(awsHelper, "readObjectToStringFromS3Url")
      .mockImplementation(async () => MOCK_2_CARDIAC_MANIFEST);

    await agService.syncWithDatabaseFromDatasetUri(
      MOCK_DATASET_URI,
      user,
      "australian-genomics-directories"
    );

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
        url: `${MOCK_STORAGE_PREFIX_URL}/2022-02-22/A0000002.bam`,
        checksums: [{ type: "MD5", value: "UPDATED_CHECKSUM" }],
      },
      {
        url: `${MOCK_STORAGE_PREFIX_URL}/2022-02-22/A0000002.bam.bai`,
        checksums: [{ type: "MD5", value: "UPDATED_CHECKSUM" }],
      },
    ];
    expect(totalFileList).toEqual(expect.arrayContaining(expected));
  });

  it("Test MOCK 3 Check file mark unavailable", async () => {
    const agService = testContainer.resolve(S3IndexApplicationService);
    const datasetService = testContainer.resolve(DatasetService);
    await datasetService.selectOrInsertDataset({
      datasetUri: MOCK_DATASET_URI,
      datasetName: "Cardiac",
      datasetDescription: "A test Flagship",
    });
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
    const linkDatasetUriQuery = e.update(e.dataset.Dataset, (d) => ({
      set: {
        cases: {
          "+=": e.insert(e.dataset.DatasetCase, {
            patients: e.set(preExistingData),
          }),
        },
      },
      filter: e.op(d.uri, "ilike", MOCK_DATASET_URI),
    }));

    await linkDatasetUriQuery.run(edgedbClient);

    // MOCK data from S3
    jest
      .spyOn(awsHelper, "awsListObjects")
      .mockImplementation(async () => MOCK_3_CARDIAC_S3_OBJECT_LIST);
    jest
      .spyOn(awsHelper, "readObjectToStringFromS3Url")
      .mockImplementation(async () => MOCK_3_CARDIAC_MANIFEST);

    await agService.syncWithDatabaseFromDatasetUri(
      MOCK_DATASET_URI,
      user,
      "australian-genomics-directories"
    );

    const expectedFileMarked = [
      `${MOCK_STORAGE_PREFIX_URL}/2022-02-22/A0000002.bam`,
      `${MOCK_STORAGE_PREFIX_URL}/2022-02-22/A0000002.bam.bai`,
    ];

    for (const e of expectedFileMarked) {
      // Query For the New Change
      const newFileRec = await fileByUrlQuery.run(edgedbClient, {
        url: e,
      });

      const newIsDeleted = newFileRec?.isDeleted;
      expect(newIsDeleted).toEqual(true);
    }
  });

  it("Test MOCK 4 Multi Study Id", async () => {
    const agService = testContainer.resolve(S3IndexApplicationService);
    const datasetService = testContainer.resolve(DatasetService);
    await datasetService.selectOrInsertDataset({
      datasetUri: MOCK_DATASET_URI,
      datasetName: "Cardiac",
      datasetDescription: "A test flagship",
    });
    jest
      .spyOn(awsHelper, "awsListObjects")
      .mockImplementation(async () => MOCK_4_CARDIAC_S3_OBJECT_LIST);
    jest
      .spyOn(awsHelper, "readObjectToStringFromS3Url")
      .mockImplementation(async () => MOCK_4_CARDIAC_MANIFEST);

    await agService.syncWithDatabaseFromDatasetUri(
      MOCK_DATASET_URI,
      user,
      "australian-genomics-directories"
    );

    // FILE schema expected values
    const totalFileList = await e
      .select(e.storage.File, () => ({
        url: true,
      }))
      .run(edgedbClient);
    expect(totalFileList.length).toEqual(2);
    const expected = [
      {
        url: `${S3_URL_PREFIX}/${MOCK_4_CARDIAC_VCF_FILENAME}`,
      },
    ];
    expect(totalFileList).toEqual(expect.arrayContaining(expected));
    const totalDatasetPatient = await e
      .select(e.dataset.DatasetPatient, () => ({
        externalIdentifiers: true,
      }))
      .run(edgedbClient);

    expect(totalDatasetPatient.length).toEqual(3);
    expect(sortFirstExternalId(totalDatasetPatient)).toEqual(
      sortFirstExternalId([
        { externalIdentifiers: [{ system: "", value: MOCK_4_STUDY_ID_1 }] },
        { externalIdentifiers: [{ system: "", value: MOCK_4_STUDY_ID_3 }] },
        { externalIdentifiers: [{ system: "", value: MOCK_4_STUDY_ID_2 }] },
      ])
    );
  });

  it("Test User Audit Event", async () => {
    const agService = testContainer.resolve(S3IndexApplicationService);
    const datasetService = testContainer.resolve(DatasetService);
    await datasetService.selectOrInsertDataset({
      datasetUri: MOCK_DATASET_URI,
      datasetName: "Cardiac",
      datasetDescription: "A test flagship",
    });
    jest
      .spyOn(awsHelper, "awsListObjects")
      .mockImplementation(async () => MOCK_4_CARDIAC_S3_OBJECT_LIST);
    jest
      .spyOn(awsHelper, "readObjectToStringFromS3Url")
      .mockImplementation(async () => MOCK_4_CARDIAC_MANIFEST);

    await agService.syncWithDatabaseFromDatasetUri(
      MOCK_DATASET_URI,
      user,
      "australian-genomics-directories"
    );

    const userAuditEvent = await e
      .select(e.audit.UserAuditEvent, (event) => ({
        whoId: true,
        whoDisplayName: true,
        actionCategory: true,
        filter: e.op(event.whoId, "=", e.str(user.subjectId)),
        order_by: event.occurredDateTime,
      }))
      .run(edgedbClient);

    expect(userAuditEvent.length).toEqual(1);
    expect(userAuditEvent[0].whoId).toEqual(user.subjectId);
    expect(userAuditEvent[0].whoDisplayName).toEqual(user.displayName);
    expect(userAuditEvent[0].actionCategory).toEqual("U");
  });
});
