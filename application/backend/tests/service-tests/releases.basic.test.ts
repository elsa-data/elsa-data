import { AuthenticatedUser } from "../../src/business/authenticated-user";
import { beforeEachCommon } from "./releases.common";
import { ReleaseService } from "../../src/business/services/release-service";
import { registerTypes } from "./setup";
import assert from "assert";
import { Client } from "edgedb";

let edgeDbClient: Client;
let releaseService: ReleaseService;
let testReleaseId: string;

let allowedDataOwnerUser: AuthenticatedUser;
let allowedPiUser: AuthenticatedUser;
let notAllowedUser: AuthenticatedUser;

beforeAll(async () => {
  const testContainer = await registerTypes();

  edgeDbClient = testContainer.resolve("Database");
  releaseService = testContainer.resolve(ReleaseService);
});

beforeEach(async () => {
  ({ testReleaseId, allowedDataOwnerUser, allowedPiUser, notAllowedUser } =
    await beforeEachCommon());
});

/**
 *
 */
it("allowed users can get release data", async () => {
  const result = await releaseService.get(allowedPiUser, testReleaseId);

  expect(result).not.toBeNull();
  assert(result != null);
});

/**
 *
 */
it("not allowed users cannot get release data", async () => {
  await expect(async () => {
    const result = await releaseService.get(notAllowedUser, testReleaseId);
  }).rejects.toThrow(Error);
});

it("basic release data is present for PI", async () => {
  const result = await releaseService.get(allowedPiUser, testReleaseId);

  expect(result).not.toBeNull();
  assert(result != null);

  expect(result.applicationDacTitle).toBe("A Study in Many Parts");
  expect(result.runningJob).toBeUndefined();
  expect(result.applicationDacDetails).toBe(
    "So this is all that we have brought over not coded"
  );
  // as the PI we will only see cases already selected
  expect(result.visibleCasesCount).toBe(6);
});

it("basic release data is present for data owner", async () => {
  const result = await releaseService.get(allowedDataOwnerUser, testReleaseId);

  expect(result).not.toBeNull();
  assert(result != null);

  expect(result.applicationDacTitle).toBe("A Study in Many Parts");
  expect(result.runningJob).toBeUndefined();
  expect(result.applicationDacDetails).toBe(
    "So this is all that we have brought over not coded"
  );
  // as the PI we will only see cases already selected
  expect(result.visibleCasesCount).toBe(14);
});
