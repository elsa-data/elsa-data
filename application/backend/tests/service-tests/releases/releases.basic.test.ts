import { AuthenticatedUser } from "../../../src/business/authenticated-user";
import { beforeEachCommon } from "../commons/releases.common";
import { ReleaseService } from "../../../src/business/services/releases/release-service";
import { registerTypes } from "../../test-dependency-injection.common";
import assert from "assert";
import { Client } from "edgedb";

let edgeDbClient: Client;
let releaseService: ReleaseService;
let testReleaseKey: string;

let allowedAdministratorUser: AuthenticatedUser;
let allowedManagerUser: AuthenticatedUser;
let notAllowedUser: AuthenticatedUser;

const testContainer = registerTypes();

beforeAll(async () => {
  edgeDbClient = testContainer.resolve("Database");
  releaseService = testContainer.resolve(ReleaseService);
});

beforeEach(async () => {
  ({
    testReleaseKey,
    allowedAdministratorUser,
    allowedManagerUser,
    notAllowedUser,
  } = await beforeEachCommon(testContainer));
});

/**
 *
 */
it("allowed users can get release data", async () => {
  const result = await releaseService.get(allowedManagerUser, testReleaseKey);

  expect(result).not.toBeNull();
  assert(result != null);
});

/**
 *
 */
it("not allowed users cannot get release data", async () => {
  await expect(async () => {
    const result = await releaseService.get(notAllowedUser, testReleaseKey);
  }).rejects.toThrow(Error);
});

it("basic release data is present for Manager", async () => {
  const result = await releaseService.get(allowedManagerUser, testReleaseKey);

  expect(result).not.toBeNull();
  assert(result != null);

  expect(result.applicationDacTitle).toBe("A Study in Many Parts");
  expect(result.runningJob).toBeUndefined();
  expect(result.applicationDacDetails).toBe(
    "So this is all that we have brought over not coded"
  );
  // as the Manager we will only see cases already selected
  expect(result.visibleCasesCount).toBe(6);
});

it("basic release data is present for release administrator", async () => {
  const result = await releaseService.get(
    allowedAdministratorUser,
    testReleaseKey
  );

  expect(result).not.toBeNull();
  assert(result != null);

  expect(result.applicationDacTitle).toBe("A Study in Many Parts");
  expect(result.runningJob).toBeUndefined();
  expect(result.applicationDacDetails).toBe(
    "So this is all that we have brought over not coded"
  );
  // as the Manager we will only see cases already selected
  expect(result.visibleCasesCount).toBe(14);
});
