import { createClient } from "edgedb";
import { blankTestData } from "../../src/test-data/blank-test-data";
import { insert10G, TENG_URI } from "../../src/test-data/insert-test-data-10g";
import { insert10F } from "../../src/test-data/insert-test-data-10f";
import e from "../../dbschema/edgeql-js";
import {
  findSpecimenQuery,
  makeSingleCodeArray,
} from "../../src/test-data/test-data-helpers";
import { TENF_URI } from "../../src/test-data/insert-test-data-10f-helpers";
import {
  BART_SPECIMEN,
  HOMER_SPECIMEN,
} from "../../src/test-data/insert-test-data-10f-simpsons";
import { JUDY_SPECIMEN } from "../../src/test-data/insert-test-data-10f-jetsons";
import {
  TEST_SUBJECT_1,
  TEST_SUBJECT_1_DISPLAY,
  TEST_SUBJECT_1_EMAIL,
} from "../../src/test-data/insert-test-users";
import { registerTypes } from "../test-dependency-injection.common";
import { App } from "../../src/app";

const testReleaseKey = "R0001";
const authCookieName = "elsa-data-id-and-bearer-tokens";
const csrfCookieName = "elsa-data-csrf-token";
const csrfHeaderName = "csrf-token";

export async function createLoggedInServerWithRelease() {
  let authCookieValue: string;
  let csrfCookieValue: string;

  // we need to blank the db _before_ we setup the server
  // or else all the test users registered in /login-bypass
  // get muddled
  await blankTestData();

  const testContainer = await registerTypes();
  const app = testContainer.resolve(App);
  const server = await app.setupServer();
  await server.ready();

  const edgeDbClient = createClient({});

  await insert10G();
  await insert10F();

  await e
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
      releaseKey: testReleaseKey,
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
    })
    .run(edgeDbClient);

  const newUserId = await e
    .insert(e.permission.User, {
      subjectId: TEST_SUBJECT_1,
      displayName: TEST_SUBJECT_1_DISPLAY,
      email: TEST_SUBJECT_1_EMAIL,
      releaseParticipant: e.select(e.release.Release, (r) => ({
        filter: e.op(r.releaseKey, "=", testReleaseKey),
        "@role": e.str("Administrator"),
      })),
    })
    .unlessConflict((u) => ({
      on: u.subjectId,
      else: e.update(u, () => ({
        set: {
          lastLoginDateTime: e.datetime_current(),
          releaseParticipant: e.select(e.release.Release, (r) => ({
            filter: e.op(r.releaseKey, "=", testReleaseKey),
            "@role": e.str("Administrator"),
          })),
        },
      })),
    }))
    .assert_single()
    .run(edgeDbClient);

  const loginResponse = await server.inject({
    method: "POST",
    url: `/auth/login-bypass-1`,
  });
  authCookieValue = (
    loginResponse.cookies.filter(
      (a: any) => a.name === authCookieName
    )[0] as any
  ).value;
  csrfCookieValue = (
    loginResponse.cookies.filter(
      (a: any) => a.name === csrfCookieName
    )[0] as any
  ).value;

  return {
    server,
    authCookieName,
    authCookieValue,
    csrfHeaderName,
    csrfCookieValue,
    testReleaseKey,
  };
}
