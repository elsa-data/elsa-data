import { Client } from "edgedb";
import assert from "assert";
import { AuthenticatedUser } from "../../../src/business/authenticated-user";
import { beforeEachCommon } from "./dataset.common";
import { registerTypes } from "../../test-dependency-injection.common";
import { DatasetService } from "../../../src/business/services/dataset-service";
import { TENG_URI } from "../../../src/test-data/dataset/insert-test-data-10g";
import {
  insert10C,
  TENC_URI,
} from "../../../src/test-data/dataset/insert-test-data-10c";
import { TENF_URI } from "../../../src/test-data/dataset/insert-test-data-10f-helpers";

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
it("basic summary get all works", async () => {
  const result = await datasetService.getAll({
    user: adminUser,
    limit: 1000,
    offset: 0,
  });

  expect(result).not.toBeNull();
  assert(result && result.data);

  expect(result.data.length).toBe(2);
});

it("basic summary get all has correct summary values for family dataset", async () => {
  const result = await datasetService.get(adminUser, TENG_URI, true);

  expect(result).not.toBeNull();
  assert(result);

  expect(result.uri).toBe(TENG_URI);
  expect(result.description).toBe("UMCCR 10G");
  expect(result.totalArtifactCount).toBe(50);

  expect(result.totalArtifactSizeBytes).toBe(1097309374141);
  expect(result.totalCaseCount).toBe(10);
  expect(result.totalPatientCount).toBe(10);
  expect(result.totalSpecimenCount).toBe(10);
});

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
  await insert10C(testContainer);

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
