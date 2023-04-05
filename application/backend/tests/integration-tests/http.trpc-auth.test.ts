import { FastifyInstance } from "fastify";
import {
  createLoggedInServerWithRelease,
  createTrpcClient,
} from "./integration.common";

describe("TRPC authentication tests", () => {
  let server: FastifyInstance;

  afterEach(async () => await server.close());

  it("a TRPC call with no session cookie will fail", async () => {
    const {
      authCookieValue,
      csrfHeaderValue,
      server: newServer,
    } = await createLoggedInServerWithRelease("Administrator");

    server = newServer;

    // no session auth cookie
    const client = await createTrpcClient(
      server,
      "/api/trpc",
      undefined,
      csrfHeaderValue
    );

    // this specific error message is due to TRPC client not understanding a "problem" JSON
    // response - which is not precisely the actual exception we'd like to trap but.. it does fail
    // when missing auth - but we could consider investigating more
    // TODO return an auth session error that is compatible with TRPC client
    await expect(async () => {
      await client.test.succeed.query({
        aNumber: 5,
        aString: "only one A",
        aArrayOfString: ["one", "two", "3"],
        aOptionalNumber: 42,
      });
    }).rejects.toThrowError(
      "The content-type of the response is not application/json"
    );
  });

  it("a TRPC call with no CSRF header will fail", async () => {
    const {
      authCookieValue,
      csrfHeaderValue,
      server: newServer,
    } = await createLoggedInServerWithRelease("Administrator");

    server = newServer;

    // no CSRF
    const client = await createTrpcClient(
      server,
      "/api/trpc",
      authCookieValue,
      undefined
    );

    // this specific error message is due to TRPC client not understanding a "problem" JSON
    // response - which is not precisely the actual exception we'd like to trap but.. it does fail
    // when missing auth - but we could consider investigating more
    // TODO return an auth session error that is compatible with TRPC client
    await expect(async () => {
      await client.test.succeed.query({
        aNumber: 5,
        aString: "only one A",
        aArrayOfString: ["one", "two", "3"],
        aOptionalNumber: 42,
      });
    }).rejects.toThrowError(
      "The content-type of the response is not application/json"
    );
  });
});
