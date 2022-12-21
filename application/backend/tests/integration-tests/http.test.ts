import { App } from "../../src/app";
import { FastifyInstance } from "fastify";
import { registerTypes } from "../service-tests/setup";

describe("http integration tests", () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    const testContainer = await registerTypes();
    const app = testContainer.resolve(App);
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
