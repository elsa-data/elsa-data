import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { releaseRoutes } from "./routes/internal/release-routes";
import { AuthenticatedUser } from "../business/authenticated-user";
import {
  currentPageSize,
  PagedResult,
  TOTAL_COUNT_HEADER_NAME,
} from "./helpers/pagination-helpers";
import { DependencyContainer } from "tsyringe";
import { UserService } from "../business/services/user-service";
import { isEmpty, isString, trim } from "lodash";
import { ElsaSettings } from "../config/elsa-settings";
import { createSessionCookieRouteHook } from "./session-cookie-route-hook";
import { manifestDownloadRoutes } from "./routes/internal/manifest-download-routes";

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
      "Inside authenticated route body but no authenticated user data",
    );

  const elsaSettings: ElsaSettings = (request as any).settings;
  // page size is either a session cookie kind of setting, or a default - but we always have a value here
  const pageSize = currentPageSize(request);
  const rawPage = (request.query as any).page;
  // we have a sensible default page across the entire system, even if not specified
  const page = parseInt(rawPage) || 1;
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
    rawPage,
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
  headers: { [key: string]: string } = {},
) {
  if (!pr) reply.status(400).send();
  else {
    reply.headers(headers).send(pr);
  }
}

/**
 * A helper function that can send arbitrary paged results back to the client
 * without checking if the result is empty and inserting headers to support paging.
 * @param reply
 * @param pr
 */
export function sendUncheckedPagedResult<T>(
  reply: FastifyReply,
  pr: PagedResult<T>,
) {
  sendResult(reply, pr.data, {
    [TOTAL_COUNT_HEADER_NAME]: pr.total.toString(),
  });
}

/**
 * A helper function that can send arbitrary paged results back to the client
 * with various headers to support paging.
 */
export function sendPagedResult<T>(
  reply: FastifyReply,
  pr: PagedResult<T> | null,
) {
  if (!pr || !pr.data) sendResult(reply, null);
  else {
    sendUncheckedPagedResult(reply, pr);
  }
}

/**
 * Defined a set of internal session/cookie authenticated
 * routes. These are routes used only by the Elsa Data React
 * front-end and are tied to its implementation (so they do
 * not need to support legacy clients - they only need to support
 * the current version).
 *
 * @param fastify
 * @param opts
 */
export const apiInternalRoutes = async (
  fastify: FastifyInstance,
  opts: {
    container: DependencyContainer;
    allowTestCookieEquals?: string;
  },
) => {
  const userService = opts.container.resolve(UserService);

  // the CSRF plugin types seem to not be compatible with fastify (types!) any more
  // as a hack just changed to any
  // will probably we good next update to CSRF plugin so can then remove any
  // We need to set this as `preHandler` as csrf token might be in the body request
  fastify.addHook("preHandler", fastify.csrfProtection as any);

  const authInternalHook = createSessionCookieRouteHook(userService);

  // now register the auth hook and then register all the rest of our routes nested within
  fastify.addHook("onRequest", authInternalHook).after(() => {
    // we want to make a new opts object as there are some values (like prefix) that can appear
    // in `opts` that we *don't* want to pass through
    const routeOpts: Opts = {
      container: opts.container,
      allowTestCookieEquals: opts.allowTestCookieEquals,
    };

    fastify.register(releaseRoutes, routeOpts);
    fastify.register(manifestDownloadRoutes, routeOpts);
  });
};
