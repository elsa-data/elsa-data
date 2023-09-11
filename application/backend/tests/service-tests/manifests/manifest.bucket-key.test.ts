import { beforeEachCommon } from "../commons/releases.common";
import { registerTypes } from "../../test-dependency-injection.common";
import assert from "assert";
import { Client } from "edgedb";
import { findSpecimenQuery } from "../../../src/test-data/util/test-data-helpers";
import {
  BART_SPECIMEN,
  HOMER_SPECIMEN,
} from "../../../src/test-data/dataset/insert-test-data-10f-simpsons";
import { JUDY_SPECIMEN } from "../../../src/test-data/dataset/insert-test-data-10f-jetsons";
import { AuthenticatedUser } from "../../../src/business/authenticated-user";
import { ManifestService } from "../../../src/business/services/manifests/manifest-service";
import { ReleaseService } from "../../../src/business/services/releases/release-service";
import { ReleaseSelectionService } from "../../../src/business/services/releases/release-selection-service";
import { ReleaseActivationService } from "../../../src/business/services/releases/release-activation-service";
import { sortBy } from "lodash";
import { CHARLES_SPECIMEN_SYSTEMLESS } from "../../../src/test-data/dataset/teng-master-data";

const testContainer = registerTypes();

let edgeDbClient: Client;
let testReleaseKey: string;
let allowedAdministratorUser: AuthenticatedUser;
let manifestService: ManifestService;
let releaseService: ReleaseService;
let releaseSelectionService: ReleaseSelectionService;
let releaseActivationService: ReleaseActivationService;

beforeAll(async () => {
  edgeDbClient = testContainer.resolve("Database");
  manifestService = testContainer.resolve(ManifestService);
  releaseService = testContainer.resolve(ReleaseService);
  releaseSelectionService = testContainer.resolve(ReleaseSelectionService);
  releaseActivationService = testContainer.resolve(ReleaseActivationService);
});

beforeEach(async () => {
  ({ testReleaseKey, allowedAdministratorUser } = await beforeEachCommon(
    testContainer
  ));

  // note that passing an empty array means "unselect all"
  await releaseSelectionService.setUnselected(
    allowedAdministratorUser,
    testReleaseKey,
    { selectAll: true }
  );

  const bart = await findSpecimenQuery(BART_SPECIMEN).run(edgeDbClient);
  const homer = await findSpecimenQuery(HOMER_SPECIMEN).run(edgeDbClient);
  const judy = await findSpecimenQuery(JUDY_SPECIMEN).run(edgeDbClient);
  const charles = await findSpecimenQuery(CHARLES_SPECIMEN_SYSTEMLESS).run(
    edgeDbClient
  );

  assert(bart);
  assert(homer);
  assert(judy);
  assert(charles);

  await releaseSelectionService.setSelected(
    allowedAdministratorUser,
    testReleaseKey,
    { dbIds: [bart.id, homer.id, judy.id, charles.id] }
  );

  // assert a release state with limited inclusions
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
  // NOTE we are enabling *both* S3 and GS (the 10g test data comes with both)
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
    false
  );

  await releaseActivationService.activateRelease(
    allowedAdministratorUser,
    testReleaseKey
  );
});

it("test basic operation of bucket key manifest", async () => {
  const manifest = await manifestService.getActiveBucketKeyManifest(
    testReleaseKey
  );

  expect(manifest).not.toBeNull();
  assert(manifest);
  expect(manifest?.objects).not.toBeNull();
  assert(manifest.objects);
  expect(manifest?.objects).toHaveLength(20);

  {
    // we sort ourselves by url length to ensure we get the real files before the indexes
    const bartBamArray = sortBy(
      manifest.objects.filter(
        (v) => v.specimenId === "NA24385" && v.objectType === "BAM"
      ),
      (o) => o.objectStoreUrl.length
    );

    expect(bartBamArray).toHaveLength(2);
    expect(bartBamArray[0].caseId).toBe("SIMPSONS");
    expect(bartBamArray[0].patientId).toBe("BART");
    expect(bartBamArray[0].specimenId).toBe("NA24385");
    expect(bartBamArray[0].objectStoreUrl).toBe(
      "s3://umccr-10f-data-dev/ASHKENAZIM/HG002.bam"
    );
    expect(bartBamArray[0].objectStoreProtocol).toBe("s3");
    expect(bartBamArray[0].objectSize).toBe(10339494500);
    expect(bartBamArray[0].md5).toBe("2395ff505be3c38744e0473f6daf1389"); // pragma: allowlist secret
    expect(bartBamArray[0].objectStoreBucket).toBe("umccr-10f-data-dev");
    expect(bartBamArray[0].objectStoreKey).toBe("ASHKENAZIM/HG002.bam");
  }

  {
    const bartVcfArray = sortBy(
      manifest.objects.filter(
        (v) => v.specimenId === "NA24385" && v.objectType === "VCF"
      ),
      (o) => o.objectStoreUrl.length
    );

    expect(bartVcfArray).toHaveLength(2);
    expect(bartVcfArray[0].caseId).toBe("SIMPSONS");
    expect(bartVcfArray[0].patientId).toBe("BART");
    expect(bartVcfArray[0].specimenId).toBe("NA24385");
    expect(bartVcfArray[0].objectSize).toBe(7732022);
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

it("test filtering by protocol results in correct objects", async () => {
  const manifest = await manifestService.getActiveBucketKeyManifest(
    testReleaseKey,
    ["gs"]
  );

  expect(manifest).not.toBeNull();
  assert(manifest);
  expect(manifest?.objects).not.toBeNull();
  assert(manifest.objects);
  expect(manifest?.objects).toHaveLength(4);

  {
    const charlesVcfArray = sortBy(
      manifest.objects.filter(
        (v) =>
          v.specimenId === CHARLES_SPECIMEN_SYSTEMLESS && v.objectType === "VCF"
      ),
      (o) => o.objectStoreUrl.length
    );

    expect(charlesVcfArray).toHaveLength(2);
    expect(charlesVcfArray[0].caseId).toBe("SINGLETONCHARLES");
    expect(charlesVcfArray[0].patientId).toBe("CHARLES");
    expect(charlesVcfArray[0].specimenId).toBe(CHARLES_SPECIMEN_SYSTEMLESS);
    expect(charlesVcfArray[0].objectSize).toBe(425745911);
    expect(charlesVcfArray[0].md5).toBe("54c76df2f55aa5a2450bd874bf488100"); // pragma: allowlist secret
    expect(charlesVcfArray[0].objectStoreUrl).toBe(
      "gs://10gbucket/HG00096/HG00096.hard-filtered.vcf.gz"
    );
    expect(charlesVcfArray[0].objectStoreBucket).toBe("10gbucket");
    expect(charlesVcfArray[0].objectStoreKey).toBe(
      "HG00096/HG00096.hard-filtered.vcf.gz"
    );
  }
});

it("test filtering by list of protocols", async () => {
  const manifest = await manifestService.getActiveBucketKeyManifest(
    testReleaseKey,
    ["gs", "s3"]
  );

  expect(manifest).not.toBeNull();
  assert(manifest);
  expect(manifest?.objects).not.toBeNull();
  assert(manifest.objects);
  expect(manifest?.objects).toHaveLength(20);
});

it("test filtering by list of wildcard protocols", async () => {
  const manifest = await manifestService.getActiveBucketKeyManifest(
    testReleaseKey,
    ["*"]
  );

  expect(manifest).not.toBeNull();
  assert(manifest);
  expect(manifest?.objects).not.toBeNull();
  assert(manifest.objects);
  expect(manifest?.objects).toHaveLength(20);
});
