import { App } from "../../src/app";
import { FastifyInstance } from "fastify";
import { registerTypes } from "../test-dependency-injection.common";
import { getServices } from "../../src/di-helpers";

describe("http integration tests", () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    const testContainer = await registerTypes();
    const { settings, logger } = getServices(testContainer);
    const app = new App(testContainer, settings, logger, new Set<string>());
    server = await app.setupServer();
    await server.ready();
  });

  afterAll(() => server.close());

  it("root page is some sort of HTML", async () => {
    const res = await server.inject({
      url: "/",
    });
    expect(res.body).toContain(`<html lang="en">`);
  });
});
