import { beforeEachCommon } from "./releases.common";
import { registerTypes } from "./setup";
import { Client } from "edgedb";
import { createReleaseManifest } from "../../src/business/services/_release-manifest-helper";
import { THOUSAND_GENOMES_SYSTEM } from "../../src/test-data/insert-test-data-10f-helpers";

let edgeDbClient: Client;
let testReleaseId: string;

beforeAll(async () => {
  const testContainer = await registerTypes();

  edgeDbClient = testContainer.resolve("Database");
});

beforeEach(async () => {
  ({ testReleaseId } = await beforeEachCommon());
});

it("test basic operation of manifest helper", async () => {
  const manifest = await createReleaseManifest(
    edgeDbClient,
    testReleaseId,
    true,
    true
  );

  expect(manifest.id).toBeDefined();
  expect(manifest.reads).toBeDefined();
  expect(manifest.variants).toBeDefined();
  expect(manifest.cases).toBeDefined();

  {
    const readValues = Object.values(manifest.reads);
    expect(readValues).toHaveLength(7);
    expect(readValues).toContainEqual({
      url: "s3://umccr-10g-data-dev/HG00173/HG00173.bam",
    });
  }

  {
    const variantValues = Object.values(manifest.variants);
    expect(variantValues).toHaveLength(7);

    // TODO need to handle sample variant names
    // expect(variantValues).toContainEqual({"url": "s3://umccr-10f-data-dev/CHINESE/EEHG002-HG003-HG004.joint.filter.vcf.gz", "variantSampleId": ""});
  }

  {
    expect(manifest.cases).toHaveLength(6);

    const simpsons = manifest.cases.find((c) => c.ids[""] === "SIMPSONS");

    expect(simpsons).toBeDefined();

    const homer = simpsons!.patients.find((p) => p.ids[""] === "HOMER");

    expect(homer).toBeDefined();
  }
});

it("test multiple blank identifiers converts to an array", async () => {
  const manifest = await createReleaseManifest(
    edgeDbClient,
    testReleaseId,
    true,
    true
  );

  // make sure we actually catch the assertion code
  expect.assertions(3);

  // our test BART has two identifiers that are systemless (empty string "")
  // when we reflect them out in a manifest - we want them to convert to an array
  for (const c of manifest.cases) {
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
  const manifest = await createReleaseManifest(
    edgeDbClient,
    testReleaseId,
    false,
    true
  );

  expect(manifest.reads).toStrictEqual({});
});

it("test variants data needs to be specified to be included", async () => {
  const manifest = await createReleaseManifest(
    edgeDbClient,
    testReleaseId,
    true,
    false
  );

  expect(manifest.variants).toStrictEqual({});
});
