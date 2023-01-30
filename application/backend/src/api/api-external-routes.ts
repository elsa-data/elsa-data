import { FastifyInstance } from "fastify";
import { DependencyContainer } from "tsyringe";
import { UsersService } from "../business/services/users-service";
import { createBearerRouteHook } from "./bearer-route-hook";
import { manifestRoutes } from "./routes/external/manifest-routes";

/**
 * An API area for requests that come from external parties, but which require
 * specific authentication per request. For instance, some might be service to service
 * interactions where we trust the other services via TLS, or maybe via
 * Bearer pre-shared keys.
 *
 * @param fastify
 * @param opts
 */
export const apiExternalRoutes = async (
  fastify: FastifyInstance,
  opts: {
    container: DependencyContainer;
  }
) => {
  const usersService = opts.container.resolve(UsersService);

  const authExternalHook = createBearerRouteHook(usersService);

  fastify.addHook("onRequest", authExternalHook).after(() => {
    fastify.register(manifestRoutes, { container: opts.container });
  });
};
