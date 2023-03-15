import { beforeEachCommon } from "./releases.common";
import { registerTypes } from "../test-dependency-injection.common";
import { Client } from "edgedb";
import { ManifestService } from "../../src/business/services/manifests/manifest-service";
import { AuthenticatedUser } from "../../src/business/authenticated-user";
import { ReleaseService } from "../../src/business/services/release-service";

let edgeDbClient: Client;
let testReleaseKey: string;
let allowedDataOwnerUser: AuthenticatedUser;
let manifestService: ManifestService;
let releaseService: ReleaseService;

beforeAll(async () => {
  const testContainer = await registerTypes();

  edgeDbClient = testContainer.resolve("Database");
  manifestService = testContainer.resolve(ManifestService);
  releaseService = testContainer.resolve(ReleaseService);
});

beforeEach(async () => {
  ({ testReleaseKey, allowedDataOwnerUser } = await beforeEachCommon());

  // assert a release state so that everything is included for the moment
  // (these are probably already set to true in the release setup but this makes sure it is true)
  await releaseService.setIsAllowed(
    allowedDataOwnerUser,
    testReleaseKey,
    "isAllowedReadData",
    true
  );
  await releaseService.setIsAllowed(
    allowedDataOwnerUser,
    testReleaseKey,
    "isAllowedVariantData",
    true
  );
  await releaseService.setIsAllowed(
    allowedDataOwnerUser,
    testReleaseKey,
    "isAllowedS3Data",
    true
  );
  await releaseService.setIsAllowed(
    allowedDataOwnerUser,
    testReleaseKey,
    "isAllowedGSData",
    true
  );
  await releaseService.setIsAllowed(
    allowedDataOwnerUser,
    testReleaseKey,
    "isAllowedR2Data",
    true
  );
});

it("test basic operation of manifest helper", async () => {
  const manifest = await manifestService.createMasterManifest(
    edgeDbClient,
    testReleaseKey
  );

  expect(manifest.releaseKey).toBe(testReleaseKey);
  expect(manifest.releaseIsAllowedReadData).toBe(true);
  expect(manifest.releaseIsAllowedVariantData).toBe(true);
  expect(manifest.releaseIsAllowedS3Data).toBe(true);
  expect(manifest.releaseIsAllowedGSData).toBe(true);
  expect(manifest.releaseIsAllowedR2Data).toBe(true);
  expect(manifest.specimenList).toHaveLength(7);
  expect(manifest.caseTree).toHaveLength(6);

  const artifactCount = manifest.specimenList.reduce(
    (accumulateCount, a) => accumulateCount + a.artifacts.length,
    0
  );

  expect(artifactCount).toBe(26);
});

it("test no reads in the master manifest", async () => {
  await releaseService.setIsAllowed(
    allowedDataOwnerUser,
    testReleaseKey,
    "isAllowedReadData",
    false
  );

  const manifest = await manifestService.createMasterManifest(
    edgeDbClient,
    testReleaseKey
  );

  expect(manifest.releaseKey).toBe(testReleaseKey);
  expect(manifest.releaseIsAllowedReadData).toBe(false);

  const artifactCount = manifest.specimenList.reduce(
    (accumulateCount, a) => accumulateCount + a.artifacts.length,
    0
  );

  expect(artifactCount).toBe(15);
});

it("test no variants in the master manifest", async () => {
  await releaseService.setIsAllowed(
    allowedDataOwnerUser,
    testReleaseKey,
    "isAllowedVariantData",
    false
  );

  const manifest = await manifestService.createMasterManifest(
    edgeDbClient,
    testReleaseKey
  );

  expect(manifest.releaseKey).toBe(testReleaseKey);
  expect(manifest.releaseIsAllowedVariantData).toBe(false);

  const artifactCount = manifest.specimenList.reduce(
    (accumulateCount, a) => accumulateCount + a.artifacts.length,
    0
  );

  expect(artifactCount).toBe(11);
});

it("test no S3 in the master manifest", async () => {
  await releaseService.setIsAllowed(
    allowedDataOwnerUser,
    testReleaseKey,
    "isAllowedS3Data",
    false
  );

  const manifest = await manifestService.createMasterManifest(
    edgeDbClient,
    testReleaseKey
  );

  expect(manifest.releaseKey).toBe(testReleaseKey);
  expect(manifest.releaseIsAllowedS3Data).toBe(false);

  const artifactCount = manifest.specimenList.reduce(
    (accumulateCount, a) => accumulateCount + a.artifacts.length,
    0
  );

  expect(artifactCount).toBe(12);
});

it("test no GS in the master manifest", async () => {
  await releaseService.setIsAllowed(
    allowedDataOwnerUser,
    testReleaseKey,
    "isAllowedGSData",
    false
  );

  const manifest = await manifestService.createMasterManifest(
    edgeDbClient,
    testReleaseKey
  );

  expect(manifest.releaseKey).toBe(testReleaseKey);
  expect(manifest.releaseIsAllowedGSData).toBe(false);

  const artifactCount = manifest.specimenList.reduce(
    (accumulateCount, a) => accumulateCount + a.artifacts.length,
    0
  );

  expect(artifactCount).toBe(18);
});

it("test no R2 in the master manifest", async () => {
  await releaseService.setIsAllowed(
    allowedDataOwnerUser,
    testReleaseKey,
    "isAllowedR2Data",
    false
  );

  const manifest = await manifestService.createMasterManifest(
    edgeDbClient,
    testReleaseKey
  );

  expect(manifest.releaseKey).toBe(testReleaseKey);
  expect(manifest.releaseIsAllowedR2Data).toBe(false);

  const artifactCount = manifest.specimenList.reduce(
    (accumulateCount, a) => accumulateCount + a.artifacts.length,
    0
  );

  expect(artifactCount).toBe(22);
});
