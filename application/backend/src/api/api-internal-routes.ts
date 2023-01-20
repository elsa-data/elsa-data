import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { releaseRoutes } from "./routes/internal/release-routes";
import { datasetRoutes } from "./routes/internal/dataset-routes";
import { AuthenticatedUser } from "../business/authenticated-user";
import {
  currentPageSize,
  PagedResult,
  TOTAL_COUNT_HEADER_NAME,
} from "./helpers/pagination-helpers";
import { DependencyContainer } from "tsyringe";
import { UsersService } from "../business/services/users-service";
import { isEmpty, isString, trim } from "lodash";
import { auditLogRoutes } from "./routes/internal/audit-log-routes";
import { dacRoutes } from "./routes/internal/dac-routes";
import { ElsaSettings } from "../config/elsa-settings";
import { createSessionCookieRouteHook } from "./session-cookie-route-hook";
import { userRoutes } from "./routes/internal/user-routes";

type Opts = {
  container: DependencyContainer;
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
  const authenticatedUser: AuthenticatedUser = (request as any).user;

  if (!authenticatedUser)
    // we should never ever get to this - but if for some reason our plumbing has gone wrong
    // then we need to stop this progressing any further
    throw new Error(
      "Inside authenticated route body but no authenticated user data"
    );

  const elsaSettings: ElsaSettings = (request as any).settings;
  // page size is either a session cookie kind of setting, or a default - but we always have a value here
  const pageSize = currentPageSize(request);
  // we have a sensible default page across the entire system, even if not specified
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
 * A helper function that can send arbitrary results back to the client, with optional headers.
 */
export function sendResult<T>(
  reply: FastifyReply,
  pr: T | null,
  headers: { [key: string]: string } = {}
) {
  if (!pr) reply.status(400).send();
  else {
    reply.headers(headers).send(pr);
  }
}

/**
 * A helper function that can send arbitrary paged results back to the client
 * but inserting various headers to support paging.
 */
export function sendPagedResult<T>(
  reply: FastifyReply,
  pr: PagedResult<T> | null
) {
  if (!pr || !pr.data) sendResult(reply, null);
  else {
    sendResult(reply, pr.data, {
      [TOTAL_COUNT_HEADER_NAME]: pr.total.toString(),
    });
  }
}

/**
 * Defined a set of internal session/cookie authenticated
 * routes.
 *
 * @param fastify
 * @param opts
 */
export const apiInternalRoutes = async (
  fastify: FastifyInstance,
  opts: {
    container: DependencyContainer;
    allowTestCookieEquals?: string;
  }
) => {
  const usersService = opts.container.resolve(UsersService);

  const authInternalHook = createSessionCookieRouteHook(
    usersService,
    opts.allowTestCookieEquals != null
  );

  // now register the auth hook and then register all the rest of our routes nested within
  fastify.addHook("onRequest", authInternalHook).after(() => {
    // we want to make a new opts object as there are some values (like prefix) that can appear
    // in `opts` that we *don't* want to pass through
    const routeOpts: Opts = {
      container: opts.container,
      allowTestCookieEquals: opts.allowTestCookieEquals,
    };

    fastify.register(auditLogRoutes, routeOpts);
    fastify.register(releaseRoutes, routeOpts);
    fastify.register(dacRoutes, routeOpts);
    fastify.register(datasetRoutes, routeOpts);

    fastify.register(userRoutes, routeOpts);
  });
};
