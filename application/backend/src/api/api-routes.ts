import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { releaseRoutes } from "./routes/release-routes";
import { datasetRoutes } from "./routes/dataset-routes";
import { SESSION_TOKEN_PRIMARY } from "../auth/auth-constants";
import { AuthenticatedUser } from "../business/authenticated-user";
import {
  currentPageSize,
  PagedResult,
  TOTAL_COUNT_HEADER_NAME,
} from "./api-pagination";
import { container, DependencyContainer } from "tsyringe";
import { UsersService } from "../business/services/users-service";
import { isEmpty, isNil, isString, trim } from "lodash";
import { auditLogRoutes } from "./routes/audit-log-routes";
import { dacRoutes } from "./routes/dac-routes";
import { ElsaSettings } from "../config/elsa-settings";
import { createAuthRouteHook } from "../auth/auth-route-hook";
import { userRoutes } from "./routes/user-routes";

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
  // page size is either a session cookie kind of setting, or a default - but we always have a value here
  const pageSize = currentPageSize(request);
  // we have a sensible default page across the entire system, even if not specified
  const page = parseInt((request.query as any).page) || 1;
  const offset = (page - 1) * pageSize;

  if (!authenticatedUser)
    // we should never ever get to this - but if for some reason our plumbing has gone wrong
    // then we need to stop this progressing any further
    throw new Error(
      "Inside authenticated route body but no authenticated user data"
    );

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
export const apiRoutes = async (
  fastify: FastifyInstance,
  opts: {
    container: DependencyContainer;
    allowTestCookieEquals?: string;
  }
) => {
  const usersService = container.resolve(UsersService);
  //const settings = container.resolve<ElsaSettings>("Settings");

  // TODO place any unauthenticated routes first here

  const authHook = createAuthRouteHook(
    usersService,
    opts.allowTestCookieEquals != null,
    opts.allowTestCookieEquals
  );

  // now register the auth hook and then register all the rest of our routes nested within
  fastify.addHook("onRequest", authHook).after(() => {
    fastify.register(auditLogRoutes, opts);
    fastify.register(releaseRoutes, opts);
    fastify.register(dacRoutes, opts);
    fastify.register(datasetRoutes, opts);

    fastify.register(userRoutes, opts);
  });
};
