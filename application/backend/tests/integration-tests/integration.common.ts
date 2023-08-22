import { blankTestData } from "../../src/test-data/util/blank-test-data";
import {
  insert10G,
  TENG_URI,
} from "../../src/test-data/dataset/insert-test-data-10g";
import { insert10F } from "../../src/test-data/dataset/insert-test-data-10f";
import e from "../../dbschema/edgeql-js";
import {
  findSpecimenQuery,
  makeSingleCodeArray,
} from "../../src/test-data/util/test-data-helpers";
import { TENF_URI } from "../../src/test-data/dataset/insert-test-data-10f-helpers";
import {
  BART_SPECIMEN,
  HOMER_SPECIMEN,
} from "../../src/test-data/dataset/insert-test-data-10f-simpsons";
import { JUDY_SPECIMEN } from "../../src/test-data/dataset/insert-test-data-10f-jetsons";
import { TEST_SUBJECT_1 } from "../../src/test-data/user/insert-user1";
import { registerTypes } from "../test-dependency-injection.common";
import { App } from "../../src/app";
import { getServices } from "../../src/di-helpers";
import { Headers, RequestInfo, RequestInit } from "node-fetch";
import {
  HeadersEsque,
  RequestInitEsque,
  ResponseEsque,
} from "@trpc/client/dist/internals/types";
import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import { AppRouter } from "../../src/app-router";
import { FastifyInstance } from "fastify";
import {
  CSRF_TOKEN_COOKIE_NAME,
  SECURE_COOKIE_NAME,
} from "@umccr/elsa-constants";

const testReleaseKey = "R0001";
const authCookieName = SECURE_COOKIE_NAME;
const csrfCookieName = CSRF_TOKEN_COOKIE_NAME;
const csrfHeaderName = "csrf-token";

/**
 * Creates just enough of a setup that we can fake a login
 * and give access to a test release.
 */
export async function createLoggedInServerWithRelease(role: string) {
  let authCookieValue: string;
  let csrfCookieValue: string;

  // we need to blank the db _before_ we setup the server
  // or else all the test users registered in /login-bypass
  // get muddled
  await blankTestData();

  const testContainer = await registerTypes();
  const { settings, logger, edgeDbClient } = getServices(testContainer);

  // create a real instance of the app server
  const app = new App(testContainer, settings, logger, new Set<string>());
  const server = await app.setupServer();
  await server.ready();

  // insert tests datasets that we can attach to a release
  await insert10G(testContainer);
  await insert10F(testContainer);

  await e
    .insert(e.release.Release, {
      created: e.datetime(new Date()),
      lastUpdatedSubjectId: "unknown",
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
      dataSharingConfiguration: e.insert(
        e.release.DataSharingConfiguration,
        {}
      ),
      releaseAuditLog: e.set(
        e.insert(e.audit.ReleaseAuditEvent, {
          actionCategory: "C",
          actionDescription: "Created Release",
          outcome: 0,
          whoDisplayName: "Someone",
          whoId: "a",
          occurredDateTime: e.datetime_current(),
          inProgress: false,
        })
      ),
    })
    .run(edgeDbClient);

  // make test user 1 so that we can do a bypass login as them (getting the needed
  // cookie and CSRF)
  const newUserId = await e
    .update(e.permission.User, (u) => ({
      set: {
        releaseParticipant: e.select(e.release.Release, (r) => ({
          filter: e.op(r.releaseKey, "=", testReleaseKey),
          "@role": e.str(role),
        })),
      },
      filter: e.op(u.subjectId, "=", TEST_SUBJECT_1),
    }))
    .assert_single()
    .run(edgeDbClient);

  // we have a test only route that bypasses real OIDC and logs in
  // attached to a test user
  const loginResponse = await server.inject({
    method: "POST",
    url: `/auth/login-bypass-1`,
  });

  // the auth response has authentication cookies that we want to return to allow
  // our clients under test to use as they see fit
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
    testContainer,
    server,
    authCookieName,
    authCookieValue,
    csrfHeaderName,
    // we receive the CSRF value via cookie - but the clients should use via headers - so fixing this variable name
    csrfHeaderValue: csrfCookieValue,
    testReleaseKey,
  };
}

/**
 * Returns a TRPC client configured to talk over a Fastify .inject channel.
 *
 * Allows optional specification of auth cookies and csrf - to allow these to be undefined
 * for special tests. In general, these will need all be filled in for a client call to work.
 *
 * @param server the fastify instance to call
 * @param apiPath the API path of our TRPC endpoint
 * @param authCookieValue the session auth cookie or undefined to not set it
 * @param csrfHeaderValue the CSRF header value or undefined to not set it
 */
export async function createTrpcClient(
  server: FastifyInstance,
  apiPath: string,
  authCookieValue: string | undefined,
  csrfHeaderValue: string | undefined
) {
  const lightMyRequestFetch = async (
    input: RequestInfo | URL | string,
    init?: RequestInit | RequestInitEsque
  ): Promise<ResponseEsque> => {
    const url = input as string;
    const opts = {
      url: url,
      headers: {} as any,
      cookies: {} as any,
    };
    // these won't normally be empty but we want to allow them to be for testing auth
    if (csrfHeaderValue) {
      opts.headers = { [csrfHeaderName]: csrfHeaderValue };
    }
    if (authCookieValue) {
      opts.cookies = { [authCookieName]: authCookieValue };
    }

    // map it onto fastify inject
    const injectResult = await server.inject(opts);

    // convert the result back to something fetch like
    // NOTE: this is very adhoc - the alternative would be to not use 'inject' and actually expose the
    // server on a real port and use actual fetch. But we have been using inject for our other tests so
    // we have done this
    const headers: HeadersEsque = new Headers();
    for (const [k, v] of Object.entries(injectResult.headers)) {
      if (v) {
        headers.set(k, v.toString());
      }
    }

    return {
      headers: headers,
      ok: injectResult.statusCode > 199 && injectResult.statusCode < 300,
      redirected: false,
      status: injectResult.statusCode,
      statusText: injectResult.statusMessage,
      url: url,
      clone: (): ResponseEsque => {
        throw Error(
          "clone not implemented as part of LightMyRequest/fetch bridge"
        );
      },
      json: injectResult.json,
    } as ResponseEsque;
  };

  return createTRPCProxyClient<AppRouter>({
    links: [
      httpBatchLink({
        fetch: lightMyRequestFetch,
        url: apiPath,
      }),
    ],
  });
}
