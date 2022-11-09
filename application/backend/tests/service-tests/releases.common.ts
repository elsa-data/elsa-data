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

      // we set up the test data so that in no circumstances should SINGLETONMARIA->MARIA->HG00174 specimens ever
      // be allowed to be selected
      //TO BE IMPLEMENTED
      // manualExclusions: e.select(e.dataset.DatasetCase, (dss) => ({
      //  filter: e.op(
      //   e.set(makeSystemlessIdentifier("SINGLETONMARIA")),
      //    "in",
      //    e.array_unpack(dss.externalIdentifiers)
      //  ),
      //  "@who": e.str("PA"),
      //  "@recorded": e.str("June"),
      //  "@reason": e.str("Because"),
      //})),
      releaseIdentifier: "A",
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
      auditLog: e.set(
        e.insert(e.audit.ReleaseAuditEvent, {
          actionCategory: "C",
          actionDescription: "Created Release",
          outcome: 0,
          whoDisplayName: "Someone",
          whoId: "a",
          occurredDateTime: e.datetime_current(),
        })
      ),
    })
    .run(edgeDbClient);

  const testReleaseId = testReleaseInsert.id;
  let allowedDataOwnerUser: AuthenticatedUser;
  let allowedPiUser: AuthenticatedUser;
  let notAllowedUser: AuthenticatedUser;

  // data owner has read/write access and complete visibility of everything
  {
    const allowedDataOwnerSubject = "https://i-am-admin.org";
    const allowedDisplayName = "Test User Who Is Allowed Data Owner Access";

    const allowedDataOwnerUserInsert = await e
      .insert(e.permission.User, {
        subjectId: allowedDataOwnerSubject,
        displayName: allowedDisplayName,
        releaseParticipant: e.select(e.release.Release, (r) => ({
          filter: e.op(e.uuid(testReleaseId), "=", r.id),
          "@role": e.str("DataOwner"),
        })),
      })
      .run(edgeDbClient);

    allowedDataOwnerUser = new AuthenticatedUser({
      id: allowedDataOwnerUserInsert.id,
      subjectId: allowedDataOwnerSubject,
      displayName: allowedDisplayName,
      lastLoginDateTime: new Date(),
      allowedImportDataset: false,
      allowedChangeReleaseDataOwner: false,
      allowedCreateRelease: false,
    });
  }

  // PI user has limits to read/write and only visibility of released data items
  {
    const allowedPiSubject = "http://subject1.com";
    const allowedDisplayName = "Test User Who Is Allowed PI Access";

    const allowedPiUserInsert = await e
      .insert(e.permission.User, {
        subjectId: allowedPiSubject,
        displayName: allowedDisplayName,
        releaseParticipant: e.select(e.release.Release, (r) => ({
          filter: e.op(e.uuid(testReleaseId), "=", r.id),
          "@role": e.str("PI"),
        })),
      })
      .run(edgeDbClient);

    allowedPiUser = new AuthenticatedUser({
      id: allowedPiUserInsert.id,
      subjectId: allowedPiSubject,
      displayName: allowedDisplayName,
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

    const notAllowedUserInsert = await e
      .insert(e.permission.User, {
        subjectId: notAllowedSubject,
        displayName: "Test User Who Isn't Allowed Any Access",
      })
      .run(edgeDbClient);

    notAllowedUser = new AuthenticatedUser({
      id: notAllowedUserInsert.id,
      subjectId: notAllowedSubject,
      displayName: notAllowedDisplayName,
      lastLoginDateTime: new Date(),
      allowedImportDataset: false,
      allowedChangeReleaseDataOwner: false,
      allowedCreateRelease: false,
    });
  }

  return {
    edgeDbClient,
    testReleaseId,
    allowedDataOwnerUser,
    allowedPiUser,
    notAllowedUser,
  };
}
