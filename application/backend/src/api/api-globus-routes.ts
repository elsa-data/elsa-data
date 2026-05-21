import type { FastifyInstance } from "fastify";
import { generators } from "openid-client";
import type { DependencyContainer } from "tsyringe";
import { GlobusService } from "../business/services/globus/globus-service";
import { getServices } from "../di-helpers";
import {
  FLOW_FAIL_ROUTE_PART,
  NOT_AUTHORISED_ROUTE_PART,
} from "../shared/constants-routes";
import {
  SESSION_GLOBUS_RELEASE_KEY_NAME,
  SESSION_GLOBUS_STATE_KEY_NAME,
  SESSION_GLOBUS_TOKEN_KEY_NAME,
} from "./auth/session-cookie-constants";
import { cookieBackendSessionSetKeyValue } from "./helpers/cookie-helpers";

/**
 * Routes for Globus auth (used in Globus sharer).
 *
 * @param fastify the fastify instance
 * @param opts options for establishing this route
 */
export const apiGlobusRoutes = async (
  fastify: FastifyInstance,
  opts: {
    // DI resolver
    container: DependencyContainer;
    redirectUri: string;
  },
) => {
  const { logger } = getServices(opts.container);
  // TODO: look into if auditLogService is needed

  const globusService = opts.container.resolve(GlobusService);

  fastify.get("/authorise", async (request, reply) => {
    const { releaseKey } = request.query as { releaseKey?: string }; //TODO: needed?

    const state = generators.state();

    cookieBackendSessionSetKeyValue(
      request,
      reply,
      SESSION_GLOBUS_STATE_KEY_NAME,
      state,
    );
    cookieBackendSessionSetKeyValue(
      request,
      reply,
      SESSION_GLOBUS_RELEASE_KEY_NAME,
      releaseKey,
    );

    const authUrl = globusService.getAuthoriseUrl(state, opts.redirectUri);

    logger.info({ releaseKey }, "Starting Globus OAuth2 flow");

    reply.redirect(authUrl);
  });

  fastify.get("/callback", async (request, reply) => {
    const { code, state } = request.query as {
      code?: string;
      state?: string;
    };

    const sessionState = request.session.get(SESSION_GLOBUS_STATE_KEY_NAME);
    const releaseKey = request.session.get(SESSION_GLOBUS_RELEASE_KEY_NAME);

    if (!code || !state || state !== sessionState || !releaseKey) {
      logger.warn("Globus callback: invalid state or missing code");
      // TODO: these are for elsa auth flow not globus auth
      reply.redirect(`/${NOT_AUTHORISED_ROUTE_PART}/${FLOW_FAIL_ROUTE_PART}`);
      return;
    }

    logger.info(
      { code: !!code, state, sessionState, releaseKey },
      "Globus callback received",
    );
    try {
      const token = await globusService.exchangeCodeForToken(
        code,
        opts.redirectUri,
      );
      cookieBackendSessionSetKeyValue(
        request,
        reply,
        SESSION_GLOBUS_TOKEN_KEY_NAME,
        token,
      );
      logger.info({ releaseKey }, "Globus OAuth2 flow completed");
    } catch (err) {
      logger.error(err, "Globus callback: token exchange failed");
      // TODO: these are for elsa auth flow not globus auth
      reply.redirect(`/${NOT_AUTHORISED_ROUTE_PART}/${FLOW_FAIL_ROUTE_PART}`);
      return;
    }

    reply.redirect(`/releases/${releaseKey}/detail?globusAuthorised=true`);
  });
};
