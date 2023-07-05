import { beforeEachCommon } from "./releases.common";
import { registerTypes } from "../test-dependency-injection.common";
import { Client } from "edgedb";
import { ManifestService } from "../../src/business/services/manifests/manifest-service";
import { AuthenticatedUser } from "../../src/business/authenticated-user";
import { ReleaseService } from "../../src/business/services/releases/release-service";

let edgeDbClient: Client;
let testReleaseKey: string;
let allowedAdministratorUser: AuthenticatedUser;
let manifestService: ManifestService;
let releaseService: ReleaseService;

const testContainer = registerTypes();

beforeAll(async () => {
  edgeDbClient = testContainer.resolve("Database");
  manifestService = testContainer.resolve(ManifestService);
  releaseService = testContainer.resolve(ReleaseService);
});

beforeEach(async () => {
  ({ testReleaseKey, allowedAdministratorUser } = await beforeEachCommon(
    testContainer
  ));

  // assert a release state so that everything is included for the moment
  // (these are probably already set to true in the release setup but this makes sure it is true)
  await releaseService.setIsAllowed(
    allowedAdministratorUser,
    testReleaseKey,
    "isAllowedReadData",
    true
  );
  await releaseService.setIsAllowed(
    allowedAdministratorUser,
    testReleaseKey,
    "isAllowedVariantData",
    true
  );
  await releaseService.setIsAllowed(
    allowedAdministratorUser,
    testReleaseKey,
    "isAllowedS3Data",
    true
  );
  await releaseService.setIsAllowed(
    allowedAdministratorUser,
    testReleaseKey,
    "isAllowedGSData",
    true
  );
  await releaseService.setIsAllowed(
    allowedAdministratorUser,
    testReleaseKey,
    "isAllowedR2Data",
    true
  );
  await releaseService.setDataSharingConfigurationField(
    allowedAdministratorUser,
    testReleaseKey,
    "/dataSharingConfiguration/htsgetEnabled",
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
    allowedAdministratorUser,
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
    allowedAdministratorUser,
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
    allowedAdministratorUser,
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
    allowedAdministratorUser,
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
    allowedAdministratorUser,
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
