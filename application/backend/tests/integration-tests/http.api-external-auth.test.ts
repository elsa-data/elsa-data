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

  it("get success testing external manifest auth request", async () => {
    // we haven't yet determined what the auth schema for external is - but we are proving here
    // that the base concept works
    const res = await server.inject({
      url: "/api/manifest",
      headers: {
        authorization: "Blah",
      },
    });
    expect(res.statusCode).toEqual(200);
  });

  it("get fail testing external manifest auth request with no bearer", async () => {
    const res = await server.inject({
      url: "/api/manifest",
    });
    expect(res.statusCode).toEqual(401);
  });
});
