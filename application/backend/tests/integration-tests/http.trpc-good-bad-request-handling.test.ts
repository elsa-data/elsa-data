import { FastifyInstance } from "fastify";
import {
  createLoggedInServerWithRelease,
  createTrpcClient,
} from "./integration.common";

describe("TRPC good/bad request handling tests", () => {
  let server: FastifyInstance;

  afterEach(async () => await server.close());

  it("an authenticated TRPC call can be made passing in values and receiving results", async () => {
    const {
      authCookieValue,
      csrfHeaderValue,
      server: newServer,
    } = await createLoggedInServerWithRelease("Administrator");

    server = newServer;

    const client = await createTrpcClient(
      server,
      "/api/trpc",
      authCookieValue,
      csrfHeaderValue,
    );

    const result = await client.test.succeed.query({
      aNumber: 5,
      aString: "only one A",
      aArrayOfString: ["one", "two", "3"],
      aOptionalNumber: 42,
    });

    expect(result.arrayLength).toBe(3);
    expect(result.didStringHaveLetterA).toBe(true);
    expect(result.doubledNumber).toBe(10);
  });

  // TODO some tests aligning error responses from TRPC and our 7807 handling..

  // TODO some tests stretching TRPC - large inputs etc
});
