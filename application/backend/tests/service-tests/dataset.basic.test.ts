import { AuthenticatedUser } from "../../src/business/authenticated-user";
import assert from "assert";
import { beforeEachCommon } from "./dataset.common";
import { registerTypes } from "../test-dependency-injection.common";
import { DatasetService } from "../../src/business/services/dataset-service";
import { TENG_URI } from "../../src/test-data/insert-test-data-10g";
import { insert10C, TENC_URI } from "../../src/test-data/insert-test-data-10c";
import { Client } from "edgedb";
import { TENF_URI } from "../../src/test-data/insert-test-data-10f-helpers";

let edgeDbClient: Client;
let datasetService: DatasetService;
let adminUser: AuthenticatedUser;
let notAllowedUser: AuthenticatedUser;

const testContainer = registerTypes();

// In place sorting for Object with URI properties
const sortBasedOnUri = (arr: ({ uri: string } & Record<string, any>)[]) => {
  return arr.sort((a, b) => (a.uri > b.uri ? 1 : b.uri > a.uri ? -1 : 0));
};

beforeAll(async () => {
  edgeDbClient = testContainer.resolve("Database");
  datasetService = testContainer.resolve(DatasetService);
});

beforeEach(async () => {
  ({ adminUser, notAllowedUser } = await beforeEachCommon(testContainer));
});
// WIP - William
// it("basic summary get all works", async () => {
//   const result = await datasetService.getSummary({
//     user: adminUser,
//     includeDeletedFile: true,
//     limit: 1000,
//     offset: 0,
//   });

//   expect(result).not.toBeNull();
//   assert(result && result.data);

//   expect(result.data.length).toBe(2);
// });

// it("basic summary get all has correct summary values for family dataset", async () => {
//   const result = await datasetService.getSummary({
//     user: adminUser,
//     includeDeletedFile: true,
//     limit: 1000,
//     offset: 0,
//   });

//   expect(result).not.toBeNull();
//   assert(result && result.data);

//   expect(result.data.length).toBe(2);

//   sortBasedOnUri(result.data);
//   const family = result.data[1];

//   expect(family.uri).toBe(TENG_URI);
//   expect(family.description).toBe("UMCCR 10G");
//   expect(family.totalArtifactCount).toBe(50);

//   expect(family.totalArtifactIncludes.trim()).toBe("VCF BAM");

//   expect(family.totalArtifactSizeBytes).toBe(1097309374141);
//   expect(family.totalCaseCount).toBe(10);
//   expect(family.totalPatientCount).toBe(10);
//   expect(family.totalSpecimenCount).toBe(10);
// });

it("basic summary get all is sorted by dataset URI", async () => {
  {
    const result = await datasetService.getAll({
      user: adminUser,
      limit: 1000,
      offset: 0,
    });

    assert(result && result.data);
    expect(result.data.length).toBe(2);
    sortBasedOnUri(result.data);
    expect(result.data[0].uri).toBe(TENF_URI);
    expect(result.data[1].uri).toBe(TENG_URI);
  }

  // insert the 10c dataset - which should alphabetically go to the start
  await insert10C();

  {
    const result = await datasetService.getAll({
      user: adminUser,
      limit: 1000,
      offset: 0,
    });

    assert(result && result.data);
    expect(result.data.length).toBe(3);
    sortBasedOnUri(result.data);
    expect(result.data[0].uri).toBe(TENC_URI);
    expect(result.data[1].uri).toBe(TENF_URI);
    expect(result.data[2].uri).toBe(TENG_URI);
  }
});

it("not allowed users cannot get dataset data", async () => {
  const result = await datasetService.getAll({
    user: notAllowedUser,
    includeDeletedFile: true,
    limit: 1000,
    offset: 0,
  });

  expect(result.data?.length).toBe(0);
});
