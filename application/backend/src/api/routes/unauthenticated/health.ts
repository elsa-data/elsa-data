import { FastifyInstance } from "fastify";
import { DependencyContainer } from "tsyringe";
import { getServices } from "../../../di-helpers";
import { version, platform } from "node:process";

/**
 * Routes that exist mainly for confirming functionality (health checks).
 *
 * @param fastify
 * @param opts
 */
export const healthRoutes = async (
  fastify: FastifyInstance,
  opts: {
    container: DependencyContainer;
  }
) => {
  /**
   * Add a health check route that just purely indicates connectivity to the HTTP server... should
   * not do any actual operations (like db calls). This endpoint is set up to not generate backend
   * logs so health checks don't overwhelm the logs.
   */
  fastify.get<{}>(
    "/health/check",
    { logLevel: "silent" },
    async function (request, reply) {
      reply.send("Ok");
    }
  );

  /**
   * Add a health check route that can give detailed diagnostic information (should not reveal too much -
   * but could do a Db query to prove that the db is up etc).
   * This should appear in the logs.
   */
  fastify.get("/health/check-detailed", {}, async function (request, reply) {
    const { edgeDbClient } = getServices(opts.container);
    let dbResult = "";
    try {
      const fortyTwoResult = await edgeDbClient.query("select 42;");
      dbResult = fortyTwoResult.toString();
    } catch (e: any) {
      dbResult = e.toString();
    }
    reply.send({
      server: "Fastify",
      nodeVersion: version,
      nodePlatform: platform,
      databaseResult: dbResult,
    });
  });
};
