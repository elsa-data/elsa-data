import { beforeEachCommon } from "./releases.common";
import { registerTypes } from "../test-dependency-injection.common";
import { Client } from "edgedb";
import { THOUSAND_GENOMES_SYSTEM } from "../../src/test-data/insert-test-data-10f-helpers";
import { ManifestService } from "../../src/business/services/manifests/manifest-service";
import { ReleaseService } from "../../src/business/services/release-service";
import { AuthenticatedUser } from "../../src/business/authenticated-user";
import { transformMasterManifestToHtsgetManifest } from "../../src/business/services/manifests/htsget/manifest-htsget-helper";
import {
  ManifestHtsgetEndpointNotEnabled,
  ManifestHtsgetNotAllowed,
} from "../../src/business/exceptions/manifest-htsget";
import {
  ManifestHtsgetService,
  S3ManifestHtsgetService,
} from "../../src/business/services/manifests/htsget/manifest-htsget-service";
import { ReleaseActivationService } from "../../src/business/services/release-activation-service";
import { ElsaSettings } from "../../src/config/elsa-settings";
import { mockClient } from "aws-sdk-client-mock";
import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Logger } from "pino";
import { addSeconds } from "date-fns";

const testContainer = registerTypes();

let edgeDbClient: Client;
let settings: ElsaSettings;
let testReleaseKey: string;
let allowedAdministratorUser: AuthenticatedUser;
let manifestService: ManifestService;
let releaseService: ReleaseService;
let manifestHtsgetService: ManifestHtsgetService;
let releaseActivationService: ReleaseActivationService;
let logger: Logger;

const s3ClientMock = mockClient(S3Client);

beforeAll(async () => {
  edgeDbClient = testContainer.resolve("Database");
  settings = testContainer.resolve("Settings");
  manifestService = testContainer.resolve(ManifestService);
  releaseService = testContainer.resolve(ReleaseService);
  manifestHtsgetService = testContainer.resolve(S3ManifestHtsgetService);
  releaseActivationService = testContainer.resolve(ReleaseActivationService);
  logger = testContainer.resolve("Logger");
});

beforeEach(async () => {
  s3ClientMock.reset();

  ({ testReleaseKey, allowedAdministratorUser } = await beforeEachCommon(
    testContainer
  ));

  // assert a release state so that everything is included for the moment
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
  await releaseService.setIsAllowed(
    allowedAdministratorUser,
    testReleaseKey,
    "isAllowedHtsget",
    true
  );
});

it("test basic operation of manifest helper", async () => {
  const masterManifest = await manifestService.createMasterManifest(
    edgeDbClient,
    testReleaseKey
  );

  const htsgetManifest = await transformMasterManifestToHtsgetManifest(
    masterManifest
  );

  expect(htsgetManifest.id).toBeDefined();
  expect(htsgetManifest.reads).toBeDefined();
  expect(htsgetManifest.variants).toBeDefined();
  expect(htsgetManifest.cases).toBeDefined();

  {
    const readValues = Object.values(htsgetManifest.reads);
    expect(readValues).toHaveLength(7);
    expect(readValues).toContainEqual({
      url: "s3://umccr-10g-data-dev/HG00173/HG00173.bam",
    });
  }

  {
    const variantValues = Object.values(htsgetManifest.variants);
    expect(variantValues).toHaveLength(7);

    // TODO need to handle sample variant names
    // expect(variantValues).toContainEqual({"url": "s3://umccr-10f-data-dev/CHINESE/EEHG002-HG003-HG004.joint.filter.vcf.gz", "variantSampleId": ""});
  }

  {
    expect(htsgetManifest.cases).toHaveLength(6);

    const simpsons = htsgetManifest.cases.find((c) => c.ids[""] === "SIMPSONS");

    expect(simpsons).toBeDefined();

    const homer = simpsons!.patients.find((p) => p.ids[""] === "HOMER");

    expect(homer).toBeDefined();
  }
});

it("test multiple blank identifiers converts to an array", async () => {
  const masterManifest = await manifestService.createMasterManifest(
    edgeDbClient,
    testReleaseKey
  );

  const htsgetManifest = await transformMasterManifestToHtsgetManifest(
    masterManifest
  );

  // make sure we actually catch the assertion code
  expect.assertions(3);

  // our test BART has two identifiers that are systemless (empty string "")
  // when we reflect them out in a manifest - we want them to convert to an array
  for (const c of htsgetManifest.cases) {
    if (c.ids[""] === "SIMPSONS") {
      for (const p of c.patients) {
        if (p.ids[THOUSAND_GENOMES_SYSTEM] === "HG002") {
          // ok we have found bart our test case
          const systemlessIds = p.ids[""];

          expect(systemlessIds).toHaveLength(2);
          expect(systemlessIds).toContain("BART");
          expect(systemlessIds).toContain("BARTHOLOMEW");
        }
      }
    }
  }
});

it("test read data needs to be specified to be included", async () => {
  // say that we don't want reads
  await releaseService.setIsAllowed(
    allowedAdministratorUser,
    testReleaseKey,
    "isAllowedReadData",
    false
  );

  const masterManifest = await manifestService.createMasterManifest(
    edgeDbClient,
    testReleaseKey
  );

  const htsgetManifest = await transformMasterManifestToHtsgetManifest(
    masterManifest
  );

  expect(htsgetManifest.reads).toStrictEqual({});
});

it("test variants data needs to be specified to be included", async () => {
  // say that we don't want variants
  await releaseService.setIsAllowed(
    allowedAdministratorUser,
    testReleaseKey,
    "isAllowedVariantData",
    false
  );

  const masterManifest = await manifestService.createMasterManifest(
    edgeDbClient,
    testReleaseKey
  );

  const htsgetManifest = await transformMasterManifestToHtsgetManifest(
    masterManifest
  );
  expect(htsgetManifest.variants).toStrictEqual({});
});

it("test publish htsget manifest release not activated", async () => {
  const throwsHtsgetNotAllowed = async () => {
    await manifestHtsgetService.publishHtsgetManifest(testReleaseKey);
  };

  await expect(throwsHtsgetNotAllowed()).rejects.toThrow(
    ManifestHtsgetNotAllowed
  );
});

it("test publish htsget manifest htsget not allowed", async () => {
  await releaseService.setIsAllowed(
    allowedAdministratorUser,
    testReleaseKey,
    "isAllowedHtsget",
    false
  );
  await releaseActivationService.activateRelease(
    allowedAdministratorUser,
    testReleaseKey
  );

  const throwsHtsgetNotAllowed = async () => {
    await manifestHtsgetService.publishHtsgetManifest(testReleaseKey);
  };

  await expect(throwsHtsgetNotAllowed()).rejects.toThrow(
    ManifestHtsgetNotAllowed
  );
});

it("test publish htsget manifest htsget not enabled", async () => {
  settings.htsget = undefined;

  await releaseActivationService.activateRelease(
    allowedAdministratorUser,
    testReleaseKey
  );

  const throwsHtsgetEndpointNotEnabled = async () => {
    await manifestHtsgetService.publishHtsgetManifest(testReleaseKey);
  };

  await expect(throwsHtsgetEndpointNotEnabled()).rejects.toThrow(
    ManifestHtsgetEndpointNotEnabled
  );
});

it("test publish htsget cached", async () => {
  if (settings.htsget?.maxAge === undefined) {
    logger.warn("Skipping test because htsget is not defined.");
    return;
  }

  await releaseActivationService.activateRelease(
    allowedAdministratorUser,
    testReleaseKey
  );

  s3ClientMock.on(HeadObjectCommand).resolves({
    LastModified: addSeconds(new Date(), settings.htsget.maxAge + 1000),
  });

  let value = await manifestHtsgetService.publishHtsgetManifest(testReleaseKey);

  expect(value.location).toEqual({
    bucket: settings.aws?.tempBucket,
    key: testReleaseKey,
  });
  expect(value.maxAge).toBeLessThan(settings.htsget.maxAge);
});

it("test publish htsget not cached", async () => {
  if (settings.htsget?.maxAge === undefined) {
    logger.warn("Skipping test because htsget is not defined.");
    return;
  }

  await releaseActivationService.activateRelease(
    allowedAdministratorUser,
    testReleaseKey
  );

  s3ClientMock.on(HeadObjectCommand).resolves({
    LastModified: addSeconds(new Date(), settings.htsget.maxAge - 1000),
  });
  s3ClientMock.on(PutObjectCommand).resolves({});

  let value = await manifestHtsgetService.publishHtsgetManifest(testReleaseKey);

  expect(value.location).toEqual({
    bucket: settings.aws?.tempBucket,
    key: testReleaseKey,
  });
  expect(value.maxAge).toEqual(settings.htsget.maxAge);
});
