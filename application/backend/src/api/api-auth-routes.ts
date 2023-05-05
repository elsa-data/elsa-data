import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  CSRF_TOKEN_COOKIE_NAME,
  USER_ALLOWED_COOKIE_NAME,
  USER_EMAIL_COOKIE_NAME,
  USER_NAME_COOKIE_NAME,
  USER_SUBJECT_COOKIE_NAME,
} from "@umccr/elsa-constants";
import {
  SESSION_TOKEN_PRIMARY,
  SESSION_USER_DB_OBJECT,
} from "./auth/session-cookie-constants";
import { ElsaSettings } from "../config/elsa-settings";
import { DependencyContainer } from "tsyringe";
import { UserService } from "../business/services/user-service";
import { generators } from "openid-client";
import { AuditLogService } from "../business/services/audit-log-service";
import {
  cookieForBackend,
  cookieForUI,
  createUserAllowedCookie,
} from "./helpers/cookie-helpers";
import { getServices } from "../di-helpers";
import { addTestUserRoutesAndActualUsers } from "./api-auth-routes-test-user-helper";

function createClient(settings: ElsaSettings, redirectUri: string) {
  if (!settings.oidcIssuer)
    throw new Error("Cannot establish OIDC login without OIDC settings");

  return new settings.oidcIssuer.Client({
    client_id: settings.oidcClientId,
    client_secret: settings.oidcClientSecret,
    redirect_uris: [redirectUri],
    response_types: ["code"],
    token_endpoint_auth_method: "client_secret_post",
  });
}

/**
 * Register all routes directly to do with the authz systems.
 *
 * @param fastify the fastify instance
 * @param opts options for establishing this route
 */
export const apiAuthRoutes = async (
  fastify: FastifyInstance,
  opts: {
    // DI resolver
    container: DependencyContainer;
    redirectUri: string;
    includeTestUsers: boolean;
  }
) => {
  const { logger, edgeDbClient, settings } = getServices(opts.container);

  const userService = opts.container.resolve(UserService);
  const auditLogService = opts.container.resolve(AuditLogService);

  const client = createClient(settings, opts.redirectUri);

  // the login route is the route posted to by the client to initiate a login
  // it constructs the appropriate auth url (as known to the backend only)
  // and sends it back to the client as a redirect to start the oidc flow
  fastify.post("/login", async (request, reply) => {
    const nonce = generators.nonce();

    // cookieForBackend(request, reply, "nonce", nonce);

    const redirectUrl = client.authorizationUrl({
      scope: "openid email profile", //  org.cilogon.userinfo
      // nonce: nonce,
      // state: "ABCD",
    });
    reply.redirect(redirectUrl);
  });

  // clean *our* cookies - meaning the browser is no longer authorised into Elsa Data for
  // web browsing or API calls
  const clearOurLoginState = (
    request: FastifyRequest,
    reply: FastifyReply,
    auditDetails: any = null
  ) => {
    const dbUser = request.session.get(SESSION_USER_DB_OBJECT);

    if (dbUser !== undefined) {
      auditLogService.createUserAuditEvent(
        edgeDbClient,
        dbUser.id,
        dbUser.subjectId,
        dbUser.displayName,
        "E",
        "Logout",
        auditDetails
      );
    }
    // delete all the backend session cookies
    request.session.delete();

    reply.clearCookie(USER_SUBJECT_COOKIE_NAME);
    reply.clearCookie(USER_NAME_COOKIE_NAME);
    reply.clearCookie(USER_EMAIL_COOKIE_NAME);
    reply.clearCookie(USER_ALLOWED_COOKIE_NAME);
  };

  fastify.post("/logout", async (request, reply) => {
    clearOurLoginState(request, reply);
    reply.redirect("/");
  });

  fastify.post("/logout-completely", async (request, reply) => {
    clearOurLoginState(request, reply, {
      message: "complete logout, redirected to CILogon",
    });

    // TODO: this probably needs to be configurable per OIDC setup - but given we are setting
    // up firstly for CILogon - it can wait till after that

    // CILogon has a special page to visit that clears CILogon cookie state
    reply.redirect("https://cilogon.org/logout");
  });

  if (opts.includeTestUsers) {
    await addTestUserRoutesAndActualUsers(fastify, opts);
  }
};

/**
 * Register the main callback route for completing an OIDC flow.
 *
 * @param fastify
 * @param opts
 */
export const callbackRoutes = async (
  fastify: FastifyInstance,
  opts: {
    container: DependencyContainer;
    redirectUri: string;
    includeTestUsers: boolean;
  }
) => {
  const settings = opts.container.resolve<ElsaSettings>("Settings");
  const userService = opts.container.resolve(UserService);

  // TODO persist the client/flow info somehow - so we can use nonces, state etc
  const client = createClient(settings, opts.redirectUri);

  // the cb (callback) route is the route that is redirected to as part of the OIDC flow
  // it expects a 'code' parameter on the URL and uses that to get a token set
  // from the OIDC flow
  fastify.get("/", async (request, reply) => {
    // extract raw params from the request
    const params = client.callbackParams(request.raw);

    // process the callback in the oidc-client library
    const tokenSet = await client.callback(opts.redirectUri, params, {
      // nonce: request.session.get("nonce"),
    });

    const idClaims = tokenSet.claims();

    if (!idClaims.name || !idClaims.email) {
      // TODO work out what we are doing about errors here
      reply.redirect("/missing-name-or-email");
      return;
    }

    const authUser = await userService.upsertUserForLogin(
      idClaims.sub,
      idClaims.name,
      idClaims.email,
      {
        ip: request.ip,
        hostname: request.hostname,
      }
    );

    if (!authUser) {
      // TODO: redirect to a static error page?
      reply.redirect("/error");
      return;
    }

    request.log.info(
      { resolvedUser: authUser, oidcParams: params, oidcTokens: tokenSet },
      `authRoutes: Login OIDC callback event`
    );

    // the secure session token is HTTP only - so its existence can't even be tracked in
    // the React code - it is made available to the backend that can use it as a
    // real access token
    // we also make available a copy of the Authenticated user database object so
    // we can recreate AuthenticatedUsers on every API call without hitting the database
    cookieForBackend(
      request,
      reply,
      SESSION_TOKEN_PRIMARY,
      tokenSet.access_token!
    );
    cookieForBackend(request, reply, SESSION_USER_DB_OBJECT, authUser.asJson());

    // these cookies however are available to React - PURELY for UI/display purposes
    cookieForUI(request, reply, USER_SUBJECT_COOKIE_NAME, authUser.subjectId);
    cookieForUI(request, reply, USER_NAME_COOKIE_NAME, authUser.displayName);
    cookieForUI(request, reply, USER_EMAIL_COOKIE_NAME, authUser.email);

    const userAllowedCookieString = createUserAllowedCookie(
      userService.isConfiguredSuperAdmin(authUser.subjectId),
      {
        isAllowedCreateRelease: authUser.isAllowedCreateRelease,
        isAllowedRefreshDatasetIndex: authUser.isAllowedRefreshDatasetIndex,
        isAllowedOverallAdministratorView:
          authUser.isAllowedOverallAdministratorView,
      }
    );

    cookieForUI(
      request,
      reply,
      USER_ALLOWED_COOKIE_NAME,
      userAllowedCookieString
    );

    // CSRF Token passed as cookie
    cookieForUI(
      request,
      reply,
      CSRF_TOKEN_COOKIE_NAME,
      await reply.generateCsrf()
    );

    reply.redirect("/");
  });
};
