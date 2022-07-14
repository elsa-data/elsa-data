import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { registerReleaseRoutes } from "./routes/release";
import { datasetRoutes } from "./routes/datasets";
import { TOKEN_PRIMARY } from "../auth/auth-strings";
import { ElsaSettings } from "../bootstrap-settings";
import { AuthenticatedUser } from "../business/authenticated-user";
import { currentPageSize } from "./api-pagination";
import { container } from "tsyringe";
import { AwsBaseService } from "../business/services/aws-base-service";
import { UsersService } from "../business/services/users-service";

type Opts = {
  allowTestCookieEquals?: string;
};

/**
 * A helper function that does any work which we need to do on the entrypoint
 * to pretty much every route. At the minimum, this converts untyped values
 * inserted earlier in fastify into strongly typed values.
 *
 * @param request
 */
export function authenticatedRouteOnEntryHelper(request: FastifyRequest) {
  const elsaSettings: ElsaSettings = (request as any).settings;
  const authenticatedUser: AuthenticatedUser = (request as any).user;
  const pageSize = currentPageSize(request);

  return {
    elsaSettings,
    authenticatedUser,
    pageSize,
  };
}

/**
 * The main API routes plugin point, defining a set of authenticated and
 * unauthenticated routes for use as an API
 *
 * @param fastify
 * @param opts
 */
export const apiRoutes = async (fastify: FastifyInstance, opts: Opts) => {
  const usersService = container.resolve(UsersService);

  // TODO place any unauthenticated routes first here

  // now register the auth hook and then register all the rest of our routes nested within
  fastify
    .addHook(
      "onRequest",
      /**
       * Enforce the minimum session auth access for our APIs
       *
       * @param request
       * @param reply
       */
      async (request: FastifyRequest, reply: FastifyReply) => {
        try {
          // if we are in test mode - then we want to accept a manually constructed cookie in lieu of a real
          // session cookie - so we can simulate with Postman/Curl etc
          // TODO - the cookie will have to allow us as testers to set group info etc
          if (opts.allowTestCookieEquals) {
            const rawCookie = request.cookies[TOKEN_PRIMARY];

            if (rawCookie == opts.allowTestCookieEquals) {
              // setup up the fake authed user
              (request as any).user = await usersService.getBySubjectId(
                "http://subject1.com"
              );
              return;
            }
          }

          const sessionCookieData = request.session.get(TOKEN_PRIMARY);

          if (!sessionCookieData) {
            console.log("NO SESSSION COOKIE DATA PRESENT TO ENABLE AUTH");
            reply.code(403).send();
            return;
          }

          const authedUser = await usersService.getBySubjectId(
            sessionCookieData.id
          );

          if (!authedUser) {
            console.log(`NO AUTH USER FOUND FOR ${sessionCookieData.id}`);
            reply.code(403).send();
            return;
          }

          (request as any).user = authedUser;
        } catch (error) {
          reply.code(403).send();
        }
      }
    )
    .after(() => {
      registerReleaseRoutes(fastify);
      fastify.register(datasetRoutes);
    });
};
