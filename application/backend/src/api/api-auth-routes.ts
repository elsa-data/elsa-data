import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { CSRF_TOKEN_COOKIE_NAME } from "@umccr/elsa-constants";
import {
  SESSION_TOKEN_PRIMARY,
  SESSION_USER_DB_OBJECT,
} from "./auth/session-cookie-constants";
import { ElsaSettings } from "../config/elsa-settings";
import { DependencyContainer } from "tsyringe";
import { UserService } from "../business/services/user-service";
import { generators } from "openid-client";
import { AuditEventService } from "../business/services/audit-event-service";
import {
  cookieForBackend,
  cookieForUI,
  createUserAllowedCookie,
} from "./helpers/cookie-helpers";
import { getServices } from "../di-helpers";
import { addTestUserRoutesAndActualUsers } from "./api-auth-routes-test-user-helper";
import { AuthenticatedUser } from "../business/authenticated-user";

function createClient(settings: ElsaSettings, redirectUri: string) {
  if (!settings.oidc || !settings.oidc.issuer)
    throw new Error("Cannot establish OIDC login without OIDC settings");

  return new settings.oidc.issuer.Client({
    client_id: settings.oidc.clientId,
    client_secret: settings.oidc.clientSecret,
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
  const auditLogService = opts.container.resolve(AuditEventService);

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
        dbUser.id,
        dbUser.subjectId,
        dbUser.displayName,
        "E",
        "Logout",
        auditDetails,
        0,
        new Date(),
        edgeDbClient
      );
    }
    // delete all the backend session cookies
    request.session.delete();
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

    const dbUser = await userService.upsertUserForLogin(
      idClaims.sub,
      idClaims.name,
      idClaims.email,
      {
        ip: request.ip,
      }
    );

    if (!dbUser) {
      // TODO: redirect to a static error page?
      reply.redirect("/error");
      return;
    }

    request.log.info(
      { resolvedUser: dbUser, oidcParams: params, oidcTokens: tokenSet },
      `authRoutes: Login OIDC callback event`
    );

    const authUser = new AuthenticatedUser(dbUser);

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

    // CSRF Token passed as cookie
    cookieForUI(request, reply, CSRF_TOKEN_COOKIE_NAME, reply.generateCsrf());

    reply.redirect("/");
  });
};
