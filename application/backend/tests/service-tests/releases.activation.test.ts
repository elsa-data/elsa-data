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

let allowedDataOwnerUser: AuthenticatedUser;
let allowedPiUser: AuthenticatedUser;
let notAllowedUser: AuthenticatedUser;

beforeAll(async () => {
  const testContainer = await registerTypes();

  edgeDbClient = testContainer.resolve("Database");
  releaseService = testContainer.resolve(ReleaseService);
  releaseActivationService = testContainer.resolve(ReleaseActivationService);
  manifestService = testContainer.resolve(ManifestService);
});

beforeEach(async () => {
  ({ testReleaseKey, allowedDataOwnerUser, allowedPiUser, notAllowedUser } =
    await beforeEachCommon());
});

it("releases can be activated", async () => {
  await releaseActivationService.activateRelease(
    allowedDataOwnerUser,
    testReleaseKey
  );

  const result = await releaseService.get(allowedDataOwnerUser, testReleaseKey);

  expect(result).not.toBeNull();
  assert(result != null);
  expect(result.activation).toBeDefined();
  expect(result.activation!.activatedByDisplayName).toBe(
    "Test User Who Is Allowed Data Owner Access"
  );
});

it("active releases have a manifest", async () => {
  await releaseActivationService.activateRelease(
    allowedDataOwnerUser,
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
    allowedDataOwnerUser,
    testReleaseKey
  );

  await expect(
    releaseActivationService.activateRelease(
      allowedDataOwnerUser,
      testReleaseKey
    )
  ).rejects.toThrow(ReleaseActivationStateError);
});

it("releases can be deactivated", async () => {
  await releaseActivationService.activateRelease(
    allowedDataOwnerUser,
    testReleaseKey
  );

  await releaseActivationService.deactivateRelease(
    allowedDataOwnerUser,
    testReleaseKey
  );

  const result = await releaseService.get(allowedDataOwnerUser, testReleaseKey);

  expect(result).not.toBeNull();
  assert(result != null);
  expect(result.activation).toBeUndefined();
});

it("deactivation only works when activated", async () => {
  await expect(
    releaseActivationService.deactivateRelease(
      allowedDataOwnerUser,
      testReleaseKey
    )
  ).rejects.toThrow(ReleaseDeactivationStateError);
});

it("deactivation creates a history of activations", async () => {
  await releaseActivationService.activateRelease(
    allowedDataOwnerUser,
    testReleaseKey
  );
  await releaseActivationService.deactivateRelease(
    allowedDataOwnerUser,
    testReleaseKey
  );
  await releaseActivationService.activateRelease(
    allowedDataOwnerUser,
    testReleaseKey
  );
  await releaseActivationService.deactivateRelease(
    allowedDataOwnerUser,
    testReleaseKey
  );
  await releaseActivationService.activateRelease(
    allowedDataOwnerUser,
    testReleaseKey
  );
  await releaseActivationService.deactivateRelease(
    allowedDataOwnerUser,
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
