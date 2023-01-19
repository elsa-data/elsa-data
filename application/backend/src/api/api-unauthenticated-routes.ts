import { FastifyInstance } from "fastify";
import { DependencyContainer } from "tsyringe";
import {
  testingDevRoutes,
  testingRoutes,
} from "./routes/unauthenticated/testing";

/**
 * Defined a set of routes that have no authentication
 * required.
 *
 * @param fastify
 * @param opts
 */
export const apiUnauthenticatedRoutes = async (
  fastify: FastifyInstance,
  opts: {
    container: DependencyContainer;
    addDevTestingRoutes: boolean;
  }
) => {
  // we want to make a new opts object as there are some values (like prefix) that can appear
  // in `opts` that we *don't* want to pass through
  const newOpts = {
    container: opts.container,
  };

  fastify.register(testingRoutes, newOpts);

  if (opts.addDevTestingRoutes) fastify.register(testingDevRoutes, newOpts);
};
