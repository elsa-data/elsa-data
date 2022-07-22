import { AuthenticatedUser } from "../../src/business/authenticated-user";
import assert from "assert";
import { beforeEachCommon } from "./dataset.common";
import { registerTypes } from "./setup";
import { DatasetService } from "../../src/business/services/dataset-service";
import { TENF_URI } from "../../src/test-data/insert-test-data-10f";
import { TENG_URI } from "../../src/test-data/insert-test-data-10g";
import { insert10C, TENC_URI } from "../../src/test-data/insert-test-data-10c";

const testContainer = registerTypes();

const datasetService = testContainer.resolve(DatasetService);

let adminUser: AuthenticatedUser;
let tenfDatasetId: string;
let tengDatasetId2: string;

beforeEach(async () => {
  testContainer.clearInstances();

  ({ tenfDatasetId, tengDatasetId2, adminUser } = await beforeEachCommon());
});

it("basic summary get all works", async () => {
  const result = await datasetService.getAll(adminUser, 1000, 0);

  expect(result).not.toBeNull();
  assert(result != null);

  expect(result.data.length).toBe(2);
});

it("basic summary get all has correct summary values for family dataset", async () => {
  const result = await datasetService.getAll(adminUser, 1000, 0);

  expect(result).not.toBeNull();
  assert(result != null);

  expect(result.data.length).toBe(2);

  // because we get consistently sorted results (by uri) - we expect family dataset to be first
  const family = result.data[0];

  expect(family.id).toBe(tenfDatasetId);
  expect(family.uri).toBe(TENF_URI);
  expect(family.description).toBe("UMCCR 10F");
  expect(family.summaryArtifactCount).toBe(32);
  expect(family.summaryArtifactIncludes).toBe("BAM VCF");
  expect(family.summaryArtifactSizeBytes).toBe(2880815296);
  expect(family.summaryCaseCount).toBe(4);
  expect(family.summaryPatientCount).toBe(16);
  expect(family.summarySpecimenCount).toBe(16);
});

it("basic summary get all is sorted by dataset URI", async () => {
  {
    const result = await datasetService.getAll(adminUser, 1000, 0);

    assert(result != null);
    expect(result.data.length).toBe(2);
    expect(result.data[0].uri).toBe(TENF_URI);
    expect(result.data[1].uri).toBe(TENG_URI);
  }

  // insert the 10c dataset - which should alphabetically go to the start
  await insert10C();

  {
    const result = await datasetService.getAll(adminUser, 1000, 0);

    assert(result != null);
    expect(result.data.length).toBe(3);
    expect(result.data[0].uri).toBe(TENC_URI);
    expect(result.data[1].uri).toBe(TENF_URI);
    expect(result.data[2].uri).toBe(TENG_URI);
  }
});
