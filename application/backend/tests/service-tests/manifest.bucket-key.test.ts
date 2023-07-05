import { beforeEachCommon } from "./releases.common";
import { registerTypes } from "../test-dependency-injection.common";
import assert from "assert";
import { Client } from "edgedb";
import { findSpecimenQuery } from "../../src/test-data/util/test-data-helpers";
import {
  BART_SPECIMEN,
  HOMER_SPECIMEN,
} from "../../src/test-data/dataset/insert-test-data-10f-simpsons";
import { JUDY_SPECIMEN } from "../../src/test-data/dataset/insert-test-data-10f-jetsons";
import { AuthenticatedUser } from "../../src/business/authenticated-user";
import { ManifestService } from "../../src/business/services/manifests/manifest-service";
import { ReleaseService } from "../../src/business/services/releases/release-service";
import { ReleaseSelectionService } from "../../src/business/services/releases/release-selection-service";
import { ReleaseActivationService } from "../../src/business/services/releases/release-activation-service";
import _ from "lodash";

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
    []
  );

  const bart = await findSpecimenQuery(BART_SPECIMEN).run(edgeDbClient);
  const homer = await findSpecimenQuery(HOMER_SPECIMEN).run(edgeDbClient);
  const judy = await findSpecimenQuery(JUDY_SPECIMEN).run(edgeDbClient);

  assert(bart);
  assert(homer);
  assert(judy);

  await releaseSelectionService.setSelected(
    allowedAdministratorUser,
    testReleaseKey,
    [bart.id, homer.id, judy.id]
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
    false
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
  expect(manifest?.objects).toHaveLength(12);

  {
    // we sort ourselves by url length to ensure we get the real files before the indexes
    const bartBamArray = _.sortBy(
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
    const bartVcfArray = _.sortBy(
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
