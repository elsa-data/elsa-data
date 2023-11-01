import { App } from "../../src/app";
import { FastifyInstance } from "fastify";
import { registerTypes } from "../test-dependency-injection.common";
import { getServices } from "../../src/di-helpers";
import { FEATURE_RELEASE_COHORT_CONSTRUCTOR } from "@umccr/elsa-constants";

describe("http integration tests", () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    const testContainer = await registerTypes();
    const { settings, logger } = getServices(testContainer);
    const app = new App(
      testContainer,
      settings,
      logger,
      new Set<string>([FEATURE_RELEASE_COHORT_CONSTRUCTOR]),
    );
    server = await app.setupServer();
    await server.ready();
  });

  afterAll(() => server.close());

  it("get success testing external manifest auth request", async () => {
    // we haven't yet determined what the auth schema for external is - but we are proving here
    // that the base concept works
    const res = await server.inject({
      url: "/api/manifest/areleaseid",
      headers: {
        authorization: "Blah",
      },
    });
    // NOTE: this indicates that we have got past auth - and that we are getting a 404 to mean the
    // release doesn't exist
    expect(res.statusCode).toEqual(404);
  });

  it("get fail testing external manifest auth request with no bearer", async () => {
    const res = await server.inject({
      url: "/api/manifest/areleaseid",
    });
    expect(res.statusCode).toEqual(404);
  });
});
