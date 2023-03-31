import { AuthenticatedUser } from "../../src/business/authenticated-user";
import { beforeEachCommon } from "./releases.common";
import { ReleaseService } from "../../src/business/services/release-service";
import { registerTypes } from "../test-dependency-injection.common";
import assert from "assert";
import { Client } from "edgedb";
import e from "../../dbschema/edgeql-js";
import {
  ReleaseActivationStateError,
  ReleaseDeactivationStateError,
} from "../../src/business/exceptions/release-activation";
import { ManifestService } from "../../src/business/services/manifests/manifest-service";
import { ReleaseActivationService } from "../../src/business/services/release-activation-service";

let edgeDbClient: Client;
let releaseService: ReleaseService;
let releaseActivationService: ReleaseActivationService;
let manifestService: ManifestService;
let testReleaseKey: string;

let superAdminUser: AuthenticatedUser;
let allowedManagerUser: AuthenticatedUser;
let notAllowedUser: AuthenticatedUser;

const testContainer = registerTypes();

beforeAll(async () => {
  edgeDbClient = testContainer.resolve("Database");
  releaseService = testContainer.resolve(ReleaseService);
  releaseActivationService = testContainer.resolve(ReleaseActivationService);
  manifestService = testContainer.resolve(ManifestService);
});

beforeEach(async () => {
  ({ testReleaseKey, superAdminUser, allowedManagerUser, notAllowedUser } =
    await beforeEachCommon(testContainer));
});

it("releases can be activated", async () => {
  await releaseActivationService.activateRelease(
    superAdminUser,
    testReleaseKey
  );

  const result = await releaseService.get(superAdminUser, testReleaseKey);

  expect(result).not.toBeNull();
  assert(result != null);
  expect(result.activation).toBeDefined();
  expect(result.activation!.activatedByDisplayName).toBe(
    "Test User Who Is Allowed Data Owner Access"
  );
});

it("active releases have a manifest", async () => {
  await releaseActivationService.activateRelease(
    superAdminUser,
    testReleaseKey
  );

  const result = await manifestService.getActiveManifest(testReleaseKey);

  assert(result != null);

  expect(result).toBeDefined();

  // note: we aren't doing much testing here of the _content_ of the manifest - as that should be tested
  // as part of the manifest service.. what we want to test is that some basic content is saved and returned
  expect(result).toHaveProperty("caseTree");
  expect(result.caseTree).toHaveLength(6);
  expect(result).toHaveProperty("specimenList");
});

it("releases that are active can't be activated again", async () => {
  await releaseActivationService.activateRelease(
    superAdminUser,
    testReleaseKey
  );

  await expect(
    releaseActivationService.activateRelease(superAdminUser, testReleaseKey)
  ).rejects.toThrow(ReleaseActivationStateError);
});

it("releases can be deactivated", async () => {
  await releaseActivationService.activateRelease(
    superAdminUser,
    testReleaseKey
  );

  await releaseActivationService.deactivateRelease(
    superAdminUser,
    testReleaseKey
  );

  const result = await releaseService.get(superAdminUser, testReleaseKey);

  expect(result).not.toBeNull();
  assert(result != null);
  expect(result.activation).toBeUndefined();
});

it("deactivation only works when activated", async () => {
  await expect(
    releaseActivationService.deactivateRelease(superAdminUser, testReleaseKey)
  ).rejects.toThrow(ReleaseDeactivationStateError);
});

it("deactivation creates a history of activations", async () => {
  await releaseActivationService.activateRelease(
    superAdminUser,
    testReleaseKey
  );
  await releaseActivationService.deactivateRelease(
    superAdminUser,
    testReleaseKey
  );
  await releaseActivationService.activateRelease(
    superAdminUser,
    testReleaseKey
  );
  await releaseActivationService.deactivateRelease(
    superAdminUser,
    testReleaseKey
  );
  await releaseActivationService.activateRelease(
    superAdminUser,
    testReleaseKey
  );
  await releaseActivationService.deactivateRelease(
    superAdminUser,
    testReleaseKey
  );

  // for the moment we can only check the history direct in the db
  const r = await e
    .select(e.release.Release, (r) => ({
      activation: true,
      previouslyActivated: true,
    }))
    .assert_single()
    .run(edgeDbClient);

  assert(r != null);

  expect(r.activation).toBeNull();
  expect(r.previouslyActivated).toHaveLength(3);
});
