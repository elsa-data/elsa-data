import { beforeEachCommon } from "./releases.common";
import { registerTypes } from "../test-dependency-injection.common";
import { Client } from "edgedb";
import { THOUSAND_GENOMES_SYSTEM } from "../../src/test-data/insert-test-data-10f-helpers";
import { ManifestService } from "../../src/business/services/manifests/manifest-service";
import { transformMasterManifestToHtsgetManifest } from "../../src/business/services/manifests/htsget/manifest-htsget-helper";
import { ReleaseService } from "../../src/business/services/release-service";
import { AuthenticatedUser } from "../../src/business/authenticated-user";

const testContainer = registerTypes();

let edgeDbClient: Client;
let testReleaseKey: string;
let allowedAdministratorUser: AuthenticatedUser;
let manifestService: ManifestService;
let releaseService: ReleaseService;

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
