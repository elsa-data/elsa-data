import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { registerReleaseRoutes } from "./routes/release-routes";
import { datasetRoutes } from "./routes/datasets";
import { TOKEN_PRIMARY } from "../auth/auth-strings";
import { ElsaSettings } from "../bootstrap-settings";
import { AuthenticatedUser } from "../business/authenticated-user";
import {
  currentPageSize,
  LAST_PAGE_HEADER_NAME,
  PAGE_SIZE_HEADER_NAME,
  PagedResult,
  TOTAL_COUNT_HEADER_NAME,
} from "./api-pagination";
import { container } from "tsyringe";
import { AwsBaseService } from "../business/services/aws-base-service";
import { UsersService } from "../business/services/users-service";
import LinkHeader from "http-link-header";
import { isNil, isFinite, isEmpty, trim, isString } from "lodash";
import { registerAuditLogRoutes } from "./routes/audit-log-routes";

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
  const page = parseInt((request.query as any).page) || 1;
  const offset = (page - 1) * pageSize;

  const qRaw = (request.query as any).q;
  // we want our q query to only ever be a non-empty trimmed string - or otherwise leave as undefined
  const q =
    isString(qRaw) && !isEmpty(qRaw) && !isEmpty(trim(qRaw))
      ? trim(qRaw)
      : undefined;

  return {
    elsaSettings,
    authenticatedUser,
    pageSize,
    page,
    q,
    offset,
  };
}

/**
 * A helper function that can send arbitrary paged results back to the client
 * but inserting various headers to support paging.
 *
 * @param reply
 * @param pr
 * @param currentPage
 * @param basePath
 */
export function sendPagedResult<T>(
  reply: FastifyReply,
  pr: PagedResult<T> | null,
  currentPage: number,
  basePath: string
) {
  // our services can indicate a lack of permissions, or an unknown identifier - by returning
  // null as a PagedResult
  // (they can also choose to throw an exception or other stuff - but if they do return null we want to handle it
  // safely here)
  if (isNil(pr) || isNil(pr!.data)) reply.status(400).send();
  else {
    if (!basePath.endsWith("?") && !basePath.endsWith("&"))
      throw Error(
        "The basePath for returnPagedResult must end with ? or & so that we can create the paging links"
      );

    // TBH - we don't really use RFC 8288 at the client so no point to this

    // supporting returning RFC 8288 headers
    //const l = new LinkHeader();

    //if (currentPage < pr.last)
    //  l.set({
    //    rel: "next",
    //    uri: `${basePath}page=${currentPage + 1}`,
    //  });
    //if (currentPage > 1)
    //  l.set({
    //    rel: "prev",
    //    uri: `${basePath}page=${currentPage - 1}`,
    //  });

    //if (isFinite(pr.first))
    //  l.set({
    //    rel: "first",
    //    uri: `${basePath}page=${pr.first}`,
    //  });
    //if (isFinite(pr.last))
    //  l.set({
    //    rel: "last",
    //    uri: `${basePath}page=${pr.last}`,
    //  });

    reply
      .header(TOTAL_COUNT_HEADER_NAME, pr.total.toString())
      // .header("link", l)
      .send(pr.data);
  }
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
      registerAuditLogRoutes(fastify);
      fastify.register(datasetRoutes);
    });
};
