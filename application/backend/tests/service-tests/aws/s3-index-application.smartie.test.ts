import {
  SMARTIE_DESCRIPTION,
  SMARTIE_FAKE_BUCKET,
  SMARTIE_FAKE_KEY,
  SMARTIE_NAME,
  SMARTIE_URI,
} from "../../../src/test-data/dataset/insert-test-data-smartie";
import { join } from "node:path";
import { mockClient } from "aws-sdk-client-mock";
import { S3Client } from "@aws-sdk/client-s3";
import { registerTypes } from "../../test-dependency-injection.common";
import { S3IndexApplicationService } from "../../../src/business/services/australian-genomics/s3-index-import-service";
import { AuthenticatedUser } from "../../../src/business/authenticated-user";
import { beforeEachCommon } from "../commons/user.common";
import { blankTestData } from "../../../src/test-data/util/blank-test-data";
import { DatasetService } from "../../../src/business/services/dataset-service";
import assert from "node:assert";
import { addMocksForFileSystem } from "../../../src/test-data/aws-mock/add-s3-mocks-for-filesystem";

const testContainer = registerTypes();
let user: AuthenticatedUser;

describe("Test our Smartie dataset loaded via an S3 mocking layer", () => {
  beforeAll(async () => {});

  beforeEach(async () => {
    ({ existingUser: user } = await beforeEachCommon());
  });

  afterEach(async () => {
    await blankTestData();
  });

  it("Load and update Smartie dataset", async () => {
    // replace the S3 client with a mock
    const s3Client = mockClient(S3Client);

    testContainer.register("S3Client", { useValue: s3Client });

    // now make the mock effectively load the content of the filesystem - but as if it is coming from a bucket
    await addMocksForFileSystem(
      s3Client,
      SMARTIE_FAKE_BUCKET,
      SMARTIE_FAKE_KEY,
      join(__dirname, "..", "..", "..", "datasets", "Smartie"),
    );

    // register the dataset in the database
    const datasetService = testContainer.resolve(DatasetService);

    const datasetUuid = await datasetService.selectOrInsertDataset({
      datasetUri: SMARTIE_URI,
      datasetName: SMARTIE_NAME,
      datasetDescription: SMARTIE_DESCRIPTION,
    });

    // perform and index
    const agService = testContainer.resolve(S3IndexApplicationService);

    await agService.syncWithDatabaseFromDatasetUri(
      SMARTIE_URI,
      "australian-genomics-directories",
    );

    const datasetSummary = await datasetService.get(user, SMARTIE_URI, true);

    expect(datasetSummary).toBeDefined();
    expect(datasetSummary?.cases).toHaveLength(10);

    assert(datasetSummary);
    assert(datasetSummary.cases);

    const findPatientById = (id: string) => {
      const casesWithPatient = datasetSummary?.cases.filter((a) => {
        return a.patients.find(
          (p) => p.externalIdentifiers?.map((e) => e.value).includes(id),
        );
      });

      if (casesWithPatient.length !== 1)
        fail(
          "There were multiple cases containing the same patient id OR no cases containing the patient id",
        );

      return casesWithPatient[0].patients.find(
        (p) => p.externalIdentifiers?.map((e) => e.value).includes(id),
      );
    };

    {
      const subject0008 = findPatientById("SUBJ0008");

      expect(subject0008).toBeDefined();
      assert(subject0008);
      expect(subject0008.sexAtBirth).toBe("male");
    }

    {
      const subject0009 = findPatientById("SUBJ0009");
      expect(subject0009).toBeDefined();
      assert(subject0009);
      expect(subject0009.sexAtBirth).toBe("female");
    }
  });
});
