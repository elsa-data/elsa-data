import { FastifyInstance } from "fastify";
import { ReleasePatchOperationType } from "@umccr/elsa-types";
import { createLoggedInServerWithRelease } from "./integration.common";

describe("http patch schema handling tests", () => {
  let server: FastifyInstance;

  afterEach(async () => await server.close());

  it("a basic replace operation works", async () => {
    const {
      testReleaseKey,
      authCookieName,
      authCookieValue,
      csrfHeaderName,
      csrfHeaderValue,
      server: newServer,
    } = await createLoggedInServerWithRelease("Administrator");

    server = newServer;

    const replaceOp: ReleasePatchOperationType = {
      op: "replace",
      path: "/allowedRead",
      value: false,
    };

    const res = await server.inject({
      method: "PATCH",
      url: `/api/releases/${testReleaseKey}`,
      payload: [replaceOp],
      cookies: {
        [authCookieName]: authCookieValue,
      },
      headers: {
        [csrfHeaderName]: csrfHeaderValue,
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveProperty("id");
  });

  it("a replace operation for arrays works", async () => {
    const {
      testReleaseKey,
      authCookieName,
      authCookieValue,
      csrfHeaderName,
      csrfHeaderValue,
      server: newServer,
    } = await createLoggedInServerWithRelease("Administrator");

    server = newServer;

    const replaceOp: ReleasePatchOperationType = {
      op: "replace",
      path: "/dataSharingConfiguration/gcpStorageIamUsers",
      value: ["andrew", "william"],
    };

    const res = await server.inject({
      method: "PATCH",
      url: `/api/releases/${testReleaseKey}`,
      payload: [replaceOp],
      cookies: {
        [authCookieName]: authCookieValue,
      },
      headers: {
        [csrfHeaderName]: csrfHeaderValue,
      },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveProperty("id");
  });

  it("a replace operation with wrong value type should trigger schema failure at backend", async () => {
    const {
      testReleaseKey,
      authCookieName,
      authCookieValue,
      csrfHeaderName,
      csrfHeaderValue,
      server: newServer,
    } = await createLoggedInServerWithRelease("Administrator");

    server = newServer;

    const replaceOp: any = {
      op: "replace",
      path: "/allowedRead",
      value: 5,
    };

    const res = await server.inject({
      method: "PATCH",
      url: `/api/releases/${testReleaseKey}`,
      payload: [replaceOp],
      cookies: {
        [authCookieName]: authCookieValue,
      },
      headers: {
        [csrfHeaderName]: csrfHeaderValue,
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
