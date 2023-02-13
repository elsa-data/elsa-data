import { beforeEachCommon } from "./releases.common";
import { registerTypes } from "./setup";
import assert from "assert";
import { Client } from "edgedb";
import { createReleaseFileList } from "../../src/business/services/_release-file-list-helper";
import { findSpecimenQuery } from "../../src/test-data/test-data-helpers";
import {
  BART_SPECIMEN,
  HOMER_SPECIMEN,
} from "../../src/test-data/insert-test-data-10f-simpsons";
import { JUDY_SPECIMEN } from "../../src/test-data/insert-test-data-10f-jetsons";

let edgeDbClient: Client;
let testReleaseId: string;

beforeAll(async () => {
  const testContainer = await registerTypes();

  edgeDbClient = testContainer.resolve("Database");
});

beforeEach(async () => {
  ({ testReleaseId } = await beforeEachCommon());
});

it("test basic operation of file list helper", async () => {
  const bart = await findSpecimenQuery(BART_SPECIMEN).run(edgeDbClient);
  const homer = await findSpecimenQuery(HOMER_SPECIMEN).run(edgeDbClient);
  const judy = await findSpecimenQuery(JUDY_SPECIMEN).run(edgeDbClient);

  assert(bart);
  assert(homer);
  assert(judy);

  const result = await createReleaseFileList(
    edgeDbClient,
    [bart, homer, judy],
    true,
    true
  );

  expect(result).not.toBeNull();
  expect(result).toHaveLength(5);

  {
    const bartBamArray = result.filter(
      (v) => v.specimenId === "NA24385" && v.fileType === "BAM"
    );

    expect(bartBamArray).toHaveLength(1);
    expect(bartBamArray[0].caseId).toBe("SIMPSONS");
    expect(bartBamArray[0].patientId).toBe("BART");
    expect(bartBamArray[0].specimenId).toBe("NA24385");
    expect(bartBamArray[0].size).toBe("10339494500");
    expect(bartBamArray[0].md5).toBe("2395ff505be3c38744e0473f6daf1389"); // pragma: allowlist secret
    expect(bartBamArray[0].objectStoreUrl).toBe(
      "s3://umccr-10f-data-dev/ASHKENAZIM/HG002.bam"
    );
    expect(bartBamArray[0].objectStoreBucket).toBe("umccr-10f-data-dev");
    expect(bartBamArray[0].objectStoreKey).toBe("ASHKENAZIM/HG002.bam");
  }

  {
    const bartVcfArray = result.filter(
      (v) => v.specimenId === "NA24385" && v.fileType === "VCF"
    );

    expect(bartVcfArray).toHaveLength(1);
    expect(bartVcfArray[0].caseId).toBe("SIMPSONS");
    expect(bartVcfArray[0].patientId).toBe("BART");
    expect(bartVcfArray[0].specimenId).toBe("NA24385");
    expect(bartVcfArray[0].size).toBe("7732022");
    expect(bartVcfArray[0].md5).toBe("22557caf3f2e2d27d8d1c6e4ea893ece"); // pragma: allowlist secret
    expect(bartVcfArray[0].objectStoreUrl).toBe(
      "s3://umccr-10f-data-dev/ASHKENAZIM/HG002-HG003-HG004.joint.filter.vcf.gz"
    );
    expect(bartVcfArray[0].objectStoreBucket).toBe("umccr-10f-data-dev");
    expect(bartVcfArray[0].objectStoreKey).toBe(
      "ASHKENAZIM/HG002-HG003-HG004.joint.filter.vcf.gz"
    );
  }
});

it("test includeReadData of false skips BAMs", async () => {
  const bart = await findSpecimenQuery(BART_SPECIMEN).run(edgeDbClient);
  const homer = await findSpecimenQuery(HOMER_SPECIMEN).run(edgeDbClient);
  const judy = await findSpecimenQuery(JUDY_SPECIMEN).run(edgeDbClient);

  assert(bart);
  assert(homer);
  assert(judy);

  // we are only going to ask for variant data
  const result = await createReleaseFileList(
    edgeDbClient,
    [bart, homer, judy],
    false,
    true
  );

  expect(result).not.toBeNull();
  expect(result).toHaveLength(2);

  // we shouldn't find barts BAM
  {
    const bartBamArray = result.filter(
      (v) => v.specimenId === "NA24385" && v.fileType === "BAM"
    );

    expect(bartBamArray).toHaveLength(0);
  }

  // but we still should find the VCF
  {
    const bartVcfArray = result.filter(
      (v) => v.specimenId === "NA24385" && v.fileType === "VCF"
    );

    expect(bartVcfArray).toHaveLength(1);
  }
});

it("test includeVariantData of false skips VCFs", async () => {
  const bart = await findSpecimenQuery(BART_SPECIMEN).run(edgeDbClient);
  const homer = await findSpecimenQuery(HOMER_SPECIMEN).run(edgeDbClient);
  const judy = await findSpecimenQuery(JUDY_SPECIMEN).run(edgeDbClient);

  assert(bart);
  assert(homer);
  assert(judy);

  // we are only going to ask for read data
  const result = await createReleaseFileList(
    edgeDbClient,
    [bart, homer, judy],
    true,
    false
  );

  expect(result).not.toBeNull();
  expect(result).toHaveLength(3);

  // we expect to find barts BAM
  {
    const bartBamArray = result.filter(
      (v) => v.specimenId === "NA24385" && v.fileType === "BAM"
    );

    expect(bartBamArray).toHaveLength(1);
  }

  // but we shouldn't find the VCF
  {
    const bartVcfArray = result.filter(
      (v) => v.specimenId === "NA24385" && v.fileType === "VCF"
    );

    expect(bartVcfArray).toHaveLength(0);
  }
});
