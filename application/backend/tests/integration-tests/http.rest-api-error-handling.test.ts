import { App } from "../../src/app";
import { FastifyInstance } from "fastify";
import { Base7807Response } from "@umccr/elsa-types/error-types";
import { registerTypes } from "../test-dependency-injection.common";
import { getServices } from "../../src/di-helpers";

describe("http API error handling tests", () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    const testContainer = await registerTypes();
    const { settings, logger } = getServices(testContainer);
    const app = new App(testContainer, settings, logger);
    server = await app.setupServer();
    await server.ready();
  });

  afterAll(() => server.close());

  it("get success testing endpoint succeed", async () => {
    const res = await server.inject({
      url: "/api/testing/get-succeed",
    });
    expect(res.statusCode).toEqual(200);
  });

  it("get testing error endpoint", async () => {
    const res = await server.inject({
      url: "/api/testing/get-thrown-error",
    });
    expect(res.statusCode).toEqual(406);

    const errorResponse: Base7807Response = JSON.parse(res.body);

    expect(errorResponse.title).toStrictEqual("Error was thrown");
    expect(errorResponse.status).toStrictEqual(406);
    expect(errorResponse.detail).toStrictEqual("Synchronous handler");
    expect(errorResponse).not.toHaveProperty<Base7807Response>(".instance");
  });

  it("get testing error endpoint", async () => {
    const res = await server.inject({
      url: "/api/testing/get-thrown-error-async-handler",
    });
    expect(res.statusCode).toEqual(406);

    const errorResponse: Base7807Response = JSON.parse(res.body);

    expect(errorResponse.title).toStrictEqual("Error was thrown");
    expect(errorResponse.status).toStrictEqual(406);
    expect(errorResponse.detail).toStrictEqual("Asynchronous handler");
    expect(errorResponse.instance).toStrictEqual("i-12345");
  });

  /**
   * Encountering a real NodeJs Error in the backend will end up as a 500 error - but we want to
   * make sure it's still in our RFC 7807 format
   */
  it("get testing internal error endpoint", async () => {
    const res = await server.inject({
      url: "/api/testing/get-internal-error",
    });
    expect(res.statusCode).toEqual(500);

    const errorResponse: Base7807Response = JSON.parse(res.body);

    expect(errorResponse.title).toStrictEqual("Internal Server Error");
    expect(errorResponse.status).toStrictEqual(500);
    expect(errorResponse).not.toHaveProperty<Base7807Response>(".detail");
    expect(errorResponse).not.toHaveProperty<Base7807Response>(".instance");
  });

  it("post request validation testing fail with lots of errors", async () => {
    // basically our entire input request is wrong - so we should get lots of validation errors
    const res = await server.inject({
      method: "POST",
      url: "/api/testing/post-api-validation",
      payload: {
        optionalString: 5,
        maxLengthString:
          "This is a string that is more than the max number of characters",
      },
    });

    expect(res.statusCode).toStrictEqual(400);
    expect(res.headers["content-type"]).toStrictEqual(
      "application/problem+json; charset=utf-8"
    );

    const errorResponse: Base7807Response = JSON.parse(res.body);

    // we can't go too hard here on the output message - as it depends on multiple levels of implementation
    // details (i.e. what order does ajv return validation errors)... but anyhow here is a nice set of assertions
    // that should capture things failing entirely
    expect(errorResponse.detail).toContain("must have");
    expect(errorResponse.detail).toContain("and others..");

    expect(errorResponse).toHaveProperty("validation-details");

    // todo: test the format of the validation errors once we decide on the format
  });
});
