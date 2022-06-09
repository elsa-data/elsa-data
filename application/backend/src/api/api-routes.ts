import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { registerReleaseRoutes } from "./routes/release";
import { datasetRoutes } from "./routes/datasets";
import { TOKEN_PRIMARY } from "../auth/auth-strings";
import { ElsaSettings } from "../bootstrap-settings";

type Opts = {
  allowTestCookieEquals?: string;
};

/**
 * The main API routes plugin point, defining a set of authenticated and
 * unauthenticated routes for use as an API
 *
 * @param fastify
 * @param opts
 */
export const apiRoutes = async (fastify: FastifyInstance, opts: Opts) => {
  fastify
    .addHook(
      "onRequest",
      async (request: FastifyRequest, reply: FastifyReply) => {
        try {
          // if we are in test mode - then we want to accept a manually constructed cookie in lieu of a real
          // session cookie - so we can simulate with Postman/Curl etc
          // TODO - the cookie will have to allow us as testers to set group info etc
          if (opts.allowTestCookieEquals) {
            const rawCookie = request.cookies[TOKEN_PRIMARY];

            if (rawCookie == opts.allowTestCookieEquals) return;
          }

          const data = request.session.get(TOKEN_PRIMARY);

          if (!data) {
            reply.code(401).send();
            return;
          }
        } catch (error) {
          reply.code(404).send();
        }
      }
    )
    .after(() => {
      registerReleaseRoutes(fastify);
      fastify.register(datasetRoutes);
    });
};
