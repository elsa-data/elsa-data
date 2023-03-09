import { createClient } from "edgedb";
import { blankTestData } from "../../src/test-data/blank-test-data";
import { insert10G, TENG_URI } from "../../src/test-data/insert-test-data-10g";
import e from "../../dbschema/edgeql-js";
import { AuthenticatedUser } from "../../src/business/authenticated-user";
import {
  findSpecimenQuery,
  makeSingleCodeArray,
  makeSystemlessIdentifier,
} from "../../src/test-data/test-data-helpers";
import { insert10F } from "../../src/test-data/insert-test-data-10f";
import { findSpecimen } from "./utils";
import { TENF_URI } from "../../src/test-data/insert-test-data-10f-helpers";
import {
  BART_SPECIMEN,
  HOMER_SPECIMEN,
} from "../../src/test-data/insert-test-data-10f-simpsons";
import { JUDY_SPECIMEN } from "../../src/test-data/insert-test-data-10f-jetsons";
import { getNextReleaseKey } from "../../src/business/db/release-queries";

/**
 * This is a common beforeEach call that should be used to setup a base
 * test state for all release testing.
 *
 * It returns a parcel of db ids that can be used for further setup in tests.
 *
 * If you make *any* changes here - you must re-run all the release tests
 * to ensure that the state change hasn't unexpectedly resulted in a test failing.
 */
export async function beforeEachCommon() {
  const edgeDbClient = createClient({});

  await blankTestData();
  await insert10G();
  await insert10F();

  const testReleaseInsert = await e
    .insert(e.release.Release, {
      created: e.datetime(new Date()),
      applicationDacIdentifier: { system: "", value: "XYZ" },
      applicationDacTitle: "A Study in Many Parts",
      applicationDacDetails:
        "So this is all that we have brought over not coded",
      applicationCoded: e.insert(e.release.ApplicationCoded, {
        countriesInvolved: makeSingleCodeArray("iso", "AU"),
        studyType: "DS",
        diseasesOfStudy: makeSingleCodeArray("mondo", "ABCD"),
        studyAgreesToPublish: true,
        studyIsNotCommercial: true,
        beaconQuery: {},
      }),
      // data for this release comes from 10g and 10f datasets
      datasetUris: e.array([TENG_URI, TENF_URI]),
      datasetCaseUrisOrderPreference: [""],
      datasetSpecimenUrisOrderPreference: [""],
      datasetIndividualUrisOrderPreference: [""],
      isAllowedReadData: true,
      isAllowedVariantData: true,
      isAllowedPhenotypeData: true,
      releaseKey: getNextReleaseKey(),
      releasePassword: "A", // pragma: allowlist secret
      // we pre-select a bunch of specimens across 10g and 10f
      selectedSpecimens: e.set(
        findSpecimenQuery("HG00096"),
        findSpecimenQuery("HG00171"),
        findSpecimenQuery("HG00173"),
        findSpecimenQuery("HG03433"),
        findSpecimenQuery(BART_SPECIMEN),
        findSpecimenQuery(HOMER_SPECIMEN),
        findSpecimenQuery(JUDY_SPECIMEN)
      ),
      releaseAuditLog: e.set(
        e.insert(e.audit.ReleaseAuditEvent, {
          actionCategory: "C",
          actionDescription: "Created Release",
          outcome: 0,
          whoDisplayName: "Someone",
          whoId: "a",
          occurredDateTime: e.datetime_current(),
        })
      ),
      lastDateTimeDataAccessLogQuery: e.datetime_current(),
    })
    .run(edgeDbClient);

  const rQuery = await e
    .select(e.release.Release, (r) => ({
      releaseKey: true,
      filter_single: e.op(e.uuid(testReleaseInsert.id), "=", r.id),
    }))
    .assert_single()
    .run(edgeDbClient);
  const testReleaseKey = rQuery?.releaseKey ?? "";

  let allowedDataOwnerUser: AuthenticatedUser;
  let allowedPiUser: AuthenticatedUser;
  let allowedMemberUser: AuthenticatedUser;
  let notAllowedUser: AuthenticatedUser;

  // data administrator has read/write access and complete visibility of everything
  {
    const allowedDataOwnerSubject = "https://i-am-admin.org";
    const allowedDisplayName = "Test User Who Is Allowed Administrator Access";
    const allowedEmail = "admin@elsa.net";

    const allowedDataOwnerUserInsert = await e
      .insert(e.permission.User, {
        subjectId: allowedDataOwnerSubject,
        displayName: allowedDisplayName,
        email: allowedEmail,
        releaseParticipant: e.select(e.release.Release, (r) => ({
          filter: e.op(testReleaseKey, "=", r.releaseKey),
          "@role": e.str("Administrator"),
        })),
      })
      .run(edgeDbClient);

    allowedDataOwnerUser = new AuthenticatedUser({
      id: allowedDataOwnerUserInsert.id,
      subjectId: allowedDataOwnerSubject,
      displayName: allowedDisplayName,
      email: allowedEmail,
      lastLoginDateTime: new Date(),
      allowedImportDataset: false,
      allowedChangeReleaseDataOwner: false,
      allowedCreateRelease: false,
    });
  }

  // Manager user has limits to read/write and only visibility of released data items
  {
    const allowedPiSubject = "http://subject1.com";
    const allowedDisplayName = "Test User Who Is Allowed Manager Access";
    const allowedEmail = "subject1@elsa.net";

    const allowedPiUserInsert = await e
      .insert(e.permission.User, {
        subjectId: allowedPiSubject,
        displayName: allowedDisplayName,
        email: allowedEmail,
        releaseParticipant: e.select(e.release.Release, (r) => ({
          filter: e.op(testReleaseKey, "=", r.releaseKey),
          "@role": e.str("Manager"),
        })),
      })
      .run(edgeDbClient);

    allowedPiUser = new AuthenticatedUser({
      id: allowedPiUserInsert.id,
      subjectId: allowedPiSubject,
      displayName: allowedDisplayName,
      email: allowedEmail,
      lastLoginDateTime: new Date(),
      allowedImportDataset: false,
      allowedChangeReleaseDataOwner: false,
      allowedCreateRelease: false,
    });
  }

  // member user has just basic access
  {
    const allowedMemberSubject = "http://subject4.com";
    const allowedMemberDisplayName = "Test User Who Is Allowed Member Access";
    const allowedMemberEmail = "subject4@elsa.net";

    const allowedMemberUserInsert = await e
      .insert(e.permission.User, {
        subjectId: allowedMemberSubject,
        displayName: allowedMemberDisplayName,
        email: allowedMemberEmail,
        releaseParticipant: e.select(e.release.Release, (r) => ({
          filter: e.op(testReleaseKey, "=", r.releaseKey),
          "@role": e.str("Member"),
        })),
      })
      .run(edgeDbClient);

    allowedMemberUser = new AuthenticatedUser({
      id: allowedMemberUserInsert.id,
      subjectId: allowedMemberSubject,
      displayName: allowedMemberDisplayName,
      email: allowedMemberEmail,
      lastLoginDateTime: new Date(),
      allowedImportDataset: false,
      allowedChangeReleaseDataOwner: false,
      allowedCreateRelease: false,
    });
  }

  // not allowed user is valid but shouldn't have ANY access to the release
  {
    const notAllowedSubject = "http://subject3.com";
    const notAllowedDisplayName = "Test User Who Isn't Allowed Any Access";
    const notAllowedEmail = "subject3@elsa.net";

    const notAllowedUserInsert = await e
      .insert(e.permission.User, {
        subjectId: notAllowedSubject,
        email: notAllowedEmail,
        displayName: "Test User Who Isn't Allowed Any Access",
      })
      .run(edgeDbClient);

    notAllowedUser = new AuthenticatedUser({
      id: notAllowedUserInsert.id,
      subjectId: notAllowedSubject,
      displayName: notAllowedDisplayName,
      email: notAllowedEmail,
      lastLoginDateTime: new Date(),
      allowedImportDataset: false,
      allowedChangeReleaseDataOwner: false,
      allowedCreateRelease: false,
    });
  }

  return {
    edgeDbClient,
    testReleaseKey,
    allowedDataOwnerUser,
    allowedPiUser,
    allowedMemberUser,
    notAllowedUser,
  };
}
