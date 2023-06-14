import {
  addMocksForFileSystem,
  SMARTIE_URI,
} from "../../src/test-data/dataset/insert-test-data-smartie";
import { join } from "node:path";
import { mockClient } from "aws-sdk-client-mock";
import { S3Client } from "@aws-sdk/client-s3";
import { registerTypes } from "../test-dependency-injection.common";
import { S3IndexApplicationService } from "../../src/business/services/australian-genomics/s3-index-import-service";
import { AuthenticatedUser } from "../../src/business/authenticated-user";
import { beforeEachCommon } from "./user.common";
import { blankTestData } from "../../src/test-data/util/blank-test-data";
import { DatasetService } from "../../src/business/services/dataset-service";

const testContainer = registerTypes();
let user: AuthenticatedUser;
describe("Test our MM dataset loaded via an S3 mocking layer", () => {
  beforeAll(async () => {});

  beforeEach(async () => {
    ({ existingUser: user } = await beforeEachCommon());

    await blankTestData();
  });

  afterEach(async () => {
    await blankTestData();
  });

  it("Load and update MM dataset", async () => {
    // replace the S3 client with a mock
    const s3Client = mockClient(S3Client);

    testContainer.register("S3Client", { useValue: s3Client });

    // now make the mock effectively load the content of the filesystem - but as if it is coming from a bucket
    await addMocksForFileSystem(
      s3Client,
      "elsa-data-test-datasets",
      join(__dirname, "..", "..", "datasets", "Smartie")
    );

    // register the dataset in the database
    const datasetService = testContainer.resolve(DatasetService);

    const datasetUuid = await datasetService.selectOrInsertDataset({
      datasetUri: SMARTIE_URI,
      datasetName: "Smartie",
      datasetDescription: "A test flagship",
    });

    // perform and index
    const agService = testContainer.resolve(S3IndexApplicationService);

    await agService.syncWithDatabaseFromDatasetUri(
      SMARTIE_URI,
      user,
      "australian-genomics-directories"
    );

    const cases = await datasetService.getCases(user, datasetUuid, 100, 0);

    expect(cases).toHaveLength(10);
  });
});
