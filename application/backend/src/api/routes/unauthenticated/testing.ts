import { FastifyInstance } from "fastify";
import { Base7807Error } from "@umccr/elsa-types/error-types";
import { testingRequestValidate } from "../../../validators/validate-json";
import { ApiRequestValidationError } from "../../errors/api-request-validation-error";

/**
 * Routes that exist mainly for use in very specific dev integration testing (do errors
 * get thrown correctly etc).
 *
 * @param fastify
 */
export const testingDevRoutes = async (fastify: FastifyInstance) => {
  fastify.get("/testing/get-succeed", {}, async function (request, reply) {
    reply.send({
      message: "yes!",
    });
  });

  fastify.get("/testing/get-thrown-error", {}, function (request, reply) {
    throw new Base7807Error("Error was thrown", 406, "Synchronous handler");
  });

  fastify.get(
    "/testing/get-thrown-error-async-handler",
    {},
    async function (request, reply) {
      throw new Base7807Error(
        "Error was thrown",
        406,
        "Asynchronous handler",
        "i-12345",
      );
    },
  );

  fastify.get("/testing/get-internal-error", {}, function (request, reply) {
    // @ts-ignore
    const val = undefined.something;

    reply.send(val);
  });

  fastify.post(
    "/testing/post-api-validation",
    {},
    async function (request, reply) {
      const validateResult = testingRequestValidate(request.body);

      if (validateResult) reply.send(true);
      else {
        throw new ApiRequestValidationError(testingRequestValidate.errors!);
      }
    },
  );
};
