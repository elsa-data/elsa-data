import { App } from "../../src/app";
import { FastifyInstance } from "fastify";
import { registerTypes } from "../test-dependency-injection.common";
import { getServices } from "../../src/di-helpers";
import { FEATURE_RELEASE_COHORT_CONSTRUCTOR } from "@umccr/elsa-constants";

describe("http API health check tests", () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    const testContainer = await registerTypes();
    const { settings, logger } = getServices(testContainer);
    const app = new App(
      testContainer,
      settings,
      logger,
      new Set<string>([FEATURE_RELEASE_COHORT_CONSTRUCTOR])
    );
    server = await app.setupServer();
    await server.ready();
  });

  afterAll(() => server.close());

  it("get success at health check endpoint", async () => {
    const res = await server.inject({
      url: "/api/health/check",
    });
    expect(res.statusCode).toEqual(200);
  });

  it("get database value from detailed health check endpoint", async () => {
    const res = await server.inject({
      url: "/api/health/check-detailed",
    });
    expect(res.statusCode).toEqual(200);
    expect(res.json().databaseResult).toBe("42");
  });
});
