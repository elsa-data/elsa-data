import { Client, createClient } from "edgedb";
import e from "../../dbschema/edgeql-js";
import { blankTestData } from "../../src/test-data/util/blank-test-data";
import {
  RELEASE3_RELEASE_IDENTIFIER,
  insertRelease3,
} from "../../src/test-data/release/insert-test-data-release3";
import { UserService } from "../../src/business/services/user-service";
import { getReleaseDataEgressSummary } from "../../dbschema/queries";
import { registerTypes } from "../test-dependency-injection.common";
import { TENF_URI } from "../../src/test-data/dataset/insert-test-data-10f-helpers";
import { ReleaseActivationService } from "../../src/business/services/releases/release-activation-service";
import { AuthenticatedUser } from "../../src/business/authenticated-user";
import { UserObject } from "../../src/test-data/user/helpers";
import { insertUser2 } from "../../src/test-data/user/insert-user2";
import { findSpecimenQuery } from "../../src/test-data/util/test-data-helpers";
import { ELROY_SPECIMEN } from "../../src/test-data/dataset/insert-test-data-10f-jetsons";
import { insert10F } from "../../src/test-data/dataset/insert-test-data-10f";

const testContainer = registerTypes();

describe("edgedb egress-release query tests", () => {
  let edgeDbClient: Client;
  let release3: { id: string };
  let adminUserObj: UserObject;
  let adminAuthUser: AuthenticatedUser;
  let releaseActivationService: ReleaseActivationService;

  beforeAll(async () => {
    edgeDbClient = createClient({});
    releaseActivationService = testContainer.resolve(ReleaseActivationService);
  });

  afterAll(() => {});

  beforeEach(async () => {
    await blankTestData();
    await insert10F(testContainer);
    adminUserObj = await insertUser2(testContainer);
    adminAuthUser = new AuthenticatedUser({
      id: adminUserObj.dbId!,
      subjectId: adminUserObj.subjectId,
      displayName: adminUserObj.name,
      email: adminUserObj.email,
    });

    const releaseProps = {
      releaseAdministrator: [adminUserObj],
      releaseMember: [],
      releaseManager: [],
      datasetUris: [TENF_URI],
    };

    release3 = await insertRelease3(testContainer, releaseProps);
  });

  it("test when release has never been activated", async () => {
    const dataEgressSummaryResult = await getReleaseDataEgressSummary(
      edgeDbClient,
      {
        releaseKey: RELEASE3_RELEASE_IDENTIFIER,
      }
    );

    // Since it never been activated, it shouldn't return any egress records
    expect(dataEgressSummaryResult).not.toBeNull();
    expect(dataEgressSummaryResult!.data.length).toBe(0);
    expect(dataEgressSummaryResult!.total).toBe(0);
  });

  it("test on `isActive` property when release is or previously activated", async () => {
    await e
      .update(e.release.Release, (r) => ({
        filter_single: e.op(r.releaseKey, "=", RELEASE3_RELEASE_IDENTIFIER),
        set: {
          isAllowedVariantData: true,
          isAllowedS3Data: true,
          selectedSpecimens: e.set(findSpecimenQuery(ELROY_SPECIMEN)),
        },
      }))
      .run(edgeDbClient);

    // Testing when activating release
    await releaseActivationService.activateRelease(
      adminAuthUser,
      RELEASE3_RELEASE_IDENTIFIER
    );
    const activeEgressSummaryResult = await getReleaseDataEgressSummary(
      edgeDbClient,
      {
        releaseKey: RELEASE3_RELEASE_IDENTIFIER,
      }
    );
    expect(activeEgressSummaryResult).not.toBeNull();
    expect(activeEgressSummaryResult!.data.length).toBe(4);
    expect(activeEgressSummaryResult!.total).toBe(4);
    for (const rec of activeEgressSummaryResult!.data) {
      expect(rec.isActive).toBe(true);
    }

    // Testing when release no longer active

    // We expect all file record that was part of the activated release is here,
    // but the isActive status will to `false`

    await releaseActivationService.deactivateRelease(
      adminAuthUser,
      RELEASE3_RELEASE_IDENTIFIER
    );
    const prevActiveEgressSummaryResult = await getReleaseDataEgressSummary(
      edgeDbClient,
      {
        releaseKey: RELEASE3_RELEASE_IDENTIFIER,
      }
    );
    expect(prevActiveEgressSummaryResult).not.toBeNull();
    expect(prevActiveEgressSummaryResult!.data.length).toBe(4);
    expect(prevActiveEgressSummaryResult!.total).toBe(4);
    for (const rec of prevActiveEgressSummaryResult!.data) {
      expect(rec.isActive).toBe(false);
    }
  });
});
