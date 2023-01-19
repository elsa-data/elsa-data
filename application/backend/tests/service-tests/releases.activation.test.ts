import { AuthenticatedUser } from "../../src/business/authenticated-user";
import { beforeEachCommon } from "./releases.common";
import { ReleaseService } from "../../src/business/services/release-service";
import { registerTypes } from "./setup";
import assert from "assert";
import { Client } from "edgedb";
import e from "../../dbschema/edgeql-js";
import {
  ReleaseActivationStateError,
  ReleaseDeactivationStateError,
} from "../../src/business/exceptions/release-activation";
import { ManifestService } from "../../src/business/services/manifests/manifest-service";

let edgeDbClient: Client;
let releaseService: ReleaseService;
let manifestService: ManifestService;
let testReleaseId: string;

let allowedDataOwnerUser: AuthenticatedUser;
let allowedPiUser: AuthenticatedUser;
let notAllowedUser: AuthenticatedUser;

beforeAll(async () => {
  const testContainer = await registerTypes();

  edgeDbClient = testContainer.resolve("Database");
  releaseService = testContainer.resolve(ReleaseService);
  manifestService = testContainer.resolve(ManifestService);
});

beforeEach(async () => {
  ({ testReleaseId, allowedDataOwnerUser, allowedPiUser, notAllowedUser } =
    await beforeEachCommon());
});

it("releases can be activated", async () => {
  await releaseService.activateRelease(allowedDataOwnerUser, testReleaseId);

  const result = await releaseService.get(allowedDataOwnerUser, testReleaseId);

  expect(result).not.toBeNull();
  assert(result != null);
  expect(result.activation).toBeDefined();
  expect(result.activation!.activatedByDisplayName).toBe(
    "Test User Who Is Allowed Data Owner Access"
  );
});

it("active releases have a manifest", async () => {
  await releaseService.activateRelease(allowedDataOwnerUser, testReleaseId);

  const result = await manifestService.getActiveManifest(testReleaseId);

  assert(result != null);

  expect(result).toBeDefined();
  expect(result).toHaveProperty("id");
  expect(result).toHaveProperty("cases");
  expect(result.cases).toHaveLength(6);
  expect(result).toHaveProperty("reads");
  expect(result).toHaveProperty("variants");
});

it("releases that are active can't be activated again", async () => {
  await releaseService.activateRelease(allowedDataOwnerUser, testReleaseId);

  await expect(
    releaseService.activateRelease(allowedDataOwnerUser, testReleaseId)
  ).rejects.toThrow(ReleaseActivationStateError);
});

it("releases can be deactivated", async () => {
  await releaseService.activateRelease(allowedDataOwnerUser, testReleaseId);

  await releaseService.deactivateRelease(allowedDataOwnerUser, testReleaseId);

  const result = await releaseService.get(allowedDataOwnerUser, testReleaseId);

  expect(result).not.toBeNull();
  assert(result != null);
  expect(result.activation).toBeUndefined();
});

it("deactivation only works when activated", async () => {
  await expect(
    releaseService.deactivateRelease(allowedDataOwnerUser, testReleaseId)
  ).rejects.toThrow(ReleaseDeactivationStateError);
});

it("deactivation creates a history of activations", async () => {
  await releaseService.activateRelease(allowedDataOwnerUser, testReleaseId);
  await releaseService.deactivateRelease(allowedDataOwnerUser, testReleaseId);
  await releaseService.activateRelease(allowedDataOwnerUser, testReleaseId);
  await releaseService.deactivateRelease(allowedDataOwnerUser, testReleaseId);
  await releaseService.activateRelease(allowedDataOwnerUser, testReleaseId);
  await releaseService.deactivateRelease(allowedDataOwnerUser, testReleaseId);

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
