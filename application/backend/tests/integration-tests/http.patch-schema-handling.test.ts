import { App } from "../../src/app";
import { FastifyInstance } from "fastify";
import { registerTypes } from "../service-tests/setup";
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
import { ReleasePatchOperationType } from "@umccr/elsa-types";
import { TEST_SUBJECT_1 } from "../../src/test-data/insert-test-users";

describe("http patch schema handling tests", () => {
  let server: FastifyInstance;
  let testReleaseInsert: { id: string };
  let authCookieName = "elsa-data-id-and-bearer-tokens";
  let authCookieValue: string;

  beforeAll(async () => {
    const testContainer = await registerTypes();
    const app = testContainer.resolve(App);
    server = await app.setupServer();
    await server.ready();
    const loginResponse = await server.inject({
      method: "POST",
      url: `/auth/login-bypass-1`,
    });
    authCookieValue = (
      loginResponse.cookies.filter(
        (a: any) => a.name === authCookieName
      )[0] as any
    ).value;
  });

  afterAll(() => server.close());

  beforeEach(async () => {
    const edgeDbClient = createClient({});

    await blankTestData();
    await insert10G();
    await insert10F();

    testReleaseInsert = await e
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

    await e
      .insert(e.permission.User, {
        subjectId: TEST_SUBJECT_1,
        displayName: "Test Subject 1",
        email: "test@example.com",
        releaseParticipant: e.select(e.release.Release, (r) => ({
          filter: e.op(r.id, "=", e.uuid(testReleaseInsert.id)),
          "@role": e.str("Member"),
        })),
      })
      .unlessConflict((u) => ({
        on: u.subjectId,
        else: e.update(u, () => ({
          set: {
            lastLoginDateTime: e.datetime_current(),
            releaseParticipant: e.select(e.release.Release, (r) => ({
              filter: e.op(r.id, "=", e.uuid(testReleaseInsert.id)),
              "@role": e.str("Member"),
            })),
          },
        })),
      }))
      .assert_single()
      .run(edgeDbClient);
  });

  it("a basic replace operation works", async () => {
    const replaceOp: ReleasePatchOperationType = {
      op: "replace",
      path: "/allowedRead",
      value: false,
    };

    const res = await server.inject({
      method: "PATCH",
      url: `/api/releases/${testReleaseInsert.id}`,
      payload: [replaceOp],
      cookies: {
        [authCookieName]: authCookieValue,
      },
    });

    expect(res.json()).toHaveProperty("id");
  });

  it("a replace operation with wrong value type should trigger schema failure at backend", async () => {
    const replaceOp: any = {
      op: "replace",
      path: "/allowedRead",
      value: 5,
    };

    const res = await server.inject({
      method: "PATCH",
      url: `/api/releases/${testReleaseInsert.id}`,
      payload: [replaceOp],
      cookies: {
        [authCookieName]: authCookieValue,
      },
    });

    expect(res.statusCode).toBe(400);
    expect(res.headers["content-type"]).toContain("application/problem+json");

    const errorResponse = JSON.parse(res.payload);

    expect(errorResponse).toHaveProperty(
      "detail",
      expect.stringContaining("body/0/value must be boolean")
    );
    expect(errorResponse).toHaveProperty("status", 400);
  });
});
