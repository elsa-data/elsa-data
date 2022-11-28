import { App } from "../../src/app";
import { FastifyInstance } from "fastify";
import { registerTypes } from "../service-tests/setup";
import { createTestElsaSettings } from "../test-elsa-settings.common";

const testContainer = registerTypes();

describe("http integration tests", () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    const app = new App(createTestElsaSettings());
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
