import { FastifyInstance } from "fastify";
import {
  DatasetGen3SyncRequestSchema,
  DatasetGen3SyncRequestType,
  DatasetGen3SyncResponseType,
} from "@umccr/elsa-types";
import { Base7807Error } from "../errors/_error.types";
import {
  datasetGen3SyncRequestValidate,
  testingRequestValidate,
} from "../../validators/validate-json";
import { ApiRequestValidationError } from "../errors/api-request-validation-error";

/**
 * Register routes that exist mainly for confirming functionality (health checks) and
 * for use by our actual integration tests.
 *
 * @param fastify
 * @param isDev true if this is a dev deployment and we can add in pure development routes
 */
export function registerTestingRoutes(
  fastify: FastifyInstance,
  isDev: boolean,
) {
  /**
   * Add a health check route that just purely indicates connectivity to the HTTP server... should
   * not do any actual operations (like db calls)
   */
  fastify.get<{}>(
    "/api/testing/health-check-lite",
    {},
    async function (request, reply) {
      reply.send({
        server: "Fastify",
      });
    },
  );

  /**
   * Add a health check route that can give detailed diagnostic information (should not reveal too much -
   * but could do a Db query to prove that the db is up etc)
   */
  fastify.get("/api/testing/health-check", {}, async function (request, reply) {
    reply.send({
      server: "Fastify",
      // add in stuff like db version / connection status etc
    });
  });

  if (isDev) {
    fastify.get(
      "/api/testing/get-succeed",
      {},
      async function (request, reply) {
        reply.send({
          message: "yes!",
        });
      },
    );

    fastify.get("/api/testing/get-thrown-error", {}, function (request, reply) {
      throw new Base7807Error("Error was thrown", 406, "Synchronous handler");
    });

    fastify.get(
      "/api/testing/get-thrown-error-async-handler",
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

    fastify.get(
      "/api/testing/get-internal-error",
      {},
      function (request, reply) {
        // @ts-ignore
        const val = undefined.something;

        reply.send(val);
      },
    );

    fastify.post(
      "/api/testing/post-api-validation",
      {},
      async function (request, reply) {
        const validateResult = testingRequestValidate(request.body);

        if (validateResult) reply.send(true);
        else {
          throw new ApiRequestValidationError(testingRequestValidate.errors!);
        }
      },
    );
  }
}
