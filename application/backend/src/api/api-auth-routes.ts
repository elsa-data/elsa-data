import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { CSRF_TOKEN_COOKIE_NAME } from "@umccr/elsa-constants";
import {
  SESSION_OIDC_NONCE_KEY_NAME,
  SESSION_OIDC_STATE_KEY_NAME,
  SESSION_USER_DB_OBJECT_KEY_NAME,
} from "./auth/session-cookie-constants";
import { ElsaSettings } from "../config/elsa-settings";
import { DependencyContainer } from "tsyringe";
import { UserService } from "../business/services/user-service";
import { errors, generators, TokenSet } from "openid-client";
import { AuditEventService } from "../business/services/audit-event-service";
import {
  cookieBackendSessionSetKeyValue,
  cookieForUI,
} from "./helpers/cookie-helpers";
import { getServices } from "../di-helpers";
import { addTestUserRoutesAndActualUsers } from "./api-auth-routes-test-user-helper";
import { AuthenticatedUser } from "../business/authenticated-user";
import {
  DATABASE_FAIL_ROUTE_PART,
  FLOW_FAIL_ROUTE_PART,
  NO_EMAIL_OR_NAME_ROUTE_PART,
  NO_SUBJECT_ID_ROUTE_PART,
  NOT_AUTHORISED_ROUTE_PART,
} from "@umccr/elsa-constants/constants-routes";

/**
 * Make this match the Typescript filename - for logging
 */
const FILENAME_FOR_LOGGING = "api-auth-routes";

function createClient(settings: ElsaSettings, redirectUri: string) {
  // we allow the absence of settings to silently go through - but will display
  // a proper exception if the undefined BaseClient is attempted to be used in practice
  if (
    !settings.oidc ||
    !settings.oidc.issuer ||
    !settings.oidc.clientId ||
    !settings.oidc.clientSecret
  )
    return undefined;

  return new settings.oidc.issuer.Client({
    client_id: settings.oidc.clientId,
    client_secret: settings.oidc.clientSecret,
    redirect_uris: [redirectUri],
    response_types: ["code"],
    token_endpoint_auth_method: "client_secret_post",
  });
}

/**
 * Register all routes that initiate actions in the authz systems.
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
  },
) => {
  const { logger, edgeDbClient, settings } = getServices(opts.container);

  const auditLogService = opts.container.resolve(AuditEventService);

  const client = createClient(settings, opts.redirectUri);

  // the login route is the route posted to by the client to initiate a login
  // it constructs the appropriate auth url (as known to the backend only)
  // and sends it back to the client as a redirect to start the oidc flow
  fastify.post("/login", async (request, reply) => {
    if (!client)
      throw new Error(
        "OIDC client not configured so cannot proceed with an OIDC login flow",
      );

    // before changing please read https://danielfett.de/2020/05/16/pkce-vs-nonce-equivalent-or-not/
    // note though we are using state rather than the newer PKCE

    // save a nonce and state
    const nonce = generators.nonce();
    const state = generators.state();
    cookieBackendSessionSetKeyValue(
      request,
      reply,
      SESSION_OIDC_STATE_KEY_NAME,
      state,
    );
    cookieBackendSessionSetKeyValue(
      request,
      reply,
      SESSION_OIDC_NONCE_KEY_NAME,
      nonce,
    );

    const oidcParams = {
      scope: "openid email profile",
      nonce: nonce,
      state: state,
    };

    const redirectUrl = client.authorizationUrl(oidcParams);

    logger.info(
      { ...oidcParams, redirectUrl },
      `${FILENAME_FOR_LOGGING}: OIDC flow start`,
    );

    reply.redirect(redirectUrl);
  });

  // clean *our* cookies - meaning the browser is no longer authorised into Elsa Data for
  // web browsing or API calls
  const clearOurLoginState = (
    request: FastifyRequest,
    reply: FastifyReply,
    auditDetails: any = null,
  ) => {
    const dbUser = request.session.get(SESSION_USER_DB_OBJECT_KEY_NAME);

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
        edgeDbClient,
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
  },
) => {
  const { settings } = getServices(opts.container);
  const userService = opts.container.resolve(UserService);

  const client = createClient(settings, opts.redirectUri);

  // the cb (callback) route is the route that is redirected to as part of the OIDC flow
  // it expects a 'code' parameter on the URL and uses that to get a token set
  // from the OIDC flow
  fastify.get("/", async (request, reply) => {
    if (!client)
      throw new Error(
        "OIDC client not configured so cannot proceed with an OIDC login flow",
      );

    // extract raw params from the request
    const params = client.callbackParams(request.raw);

    const state = request.session.get(SESSION_OIDC_STATE_KEY_NAME);
    const nonce = request.session.get(SESSION_OIDC_NONCE_KEY_NAME);

    request.log.info(
      { ...params, stateFromSession: state, nonceFromSession: nonce },
      `${FILENAME_FOR_LOGGING}: OIDC flow callback parameters`,
    );

    let tokenSet: TokenSet;

    // process the callback in the oidc-client library
    try {
      tokenSet = await client.callback(opts.redirectUri, params, {
        state: state,
        nonce: nonce,
        // we know we are doing a code flow, so we can insist on fields in the callback required for code
        response_type: "code",
      });
    } catch (err: unknown) {
      request.log.error(
        err,
        `${FILENAME_FOR_LOGGING}: OIDC flow callback processing failure`,
      );

      if (err instanceof errors.RPError) {
        // if we want to log specific details
      }

      // redirect to a page for the user to give them some indication of where this failed but no
      // details (we are not sure what details the err object itself might leak that we don't want that exposed)
      reply.redirect(`/${NOT_AUTHORISED_ROUTE_PART}/${FLOW_FAIL_ROUTE_PART}`);
      return;
    }

    request.log.info(
      tokenSet,
      `${FILENAME_FOR_LOGGING}: OIDC flow callback tokenSet`,
    );

    const idClaims = tokenSet.claims();

    if (!idClaims.sub) {
      // this should never happen - id claims will always include a subject
      reply.redirect(
        `/${NOT_AUTHORISED_ROUTE_PART}/${NO_SUBJECT_ID_ROUTE_PART}`,
      );
      return;
    }

    if (!idClaims.name || !idClaims.email) {
      reply.redirect(
        `/${NOT_AUTHORISED_ROUTE_PART}/${NO_EMAIL_OR_NAME_ROUTE_PART}`,
      );
      return;
    }

    // unless we have seen this subject or email in the system - we want to deny them any login/JWT
    if (!(await userService.existsForLogin(idClaims.sub, idClaims.email))) {
      reply.redirect(`/${NOT_AUTHORISED_ROUTE_PART}`);
      return;
    }

    // now we know they are a user worthy of some login privileges - we upsert our record of them
    // (this could include promoting a potential user to an actual user)
    const dbUser = await userService.upsertUserForLogin(
      idClaims.sub,
      idClaims.name,
      idClaims.email,
      {
        ip: request.ip,
      },
    );

    if (!dbUser) {
      reply.redirect(
        `/${NOT_AUTHORISED_ROUTE_PART}/${DATABASE_FAIL_ROUTE_PART}`,
      );
      return;
    }

    request.log.info(
      { resolvedUser: dbUser },
      `${FILENAME_FOR_LOGGING}: OIDC flow callback user`,
    );

    // the secure session token is HTTP only - so its existence can't even be tracked in
    // the React code - it is made available to the backend that can use it as a
    // real access token
    // NOTE we do not currently use this access token for anything so it is disabled
    //cookieBackendSessionSetKeyValue(
    //  request,
    //  reply,
    //  SESSION_TOKEN_PRIMARY,
    //  tokenSet.access_token!
    //);

    // we also make available a copy of the Authenticated user database object so that
    // we can rehydrate the AuthenticatedUser in each API call
    cookieBackendSessionSetKeyValue(
      request,
      reply,
      // the existence of this key in the session state is the definition of being "logged in"
      SESSION_USER_DB_OBJECT_KEY_NAME,
      new AuthenticatedUser(dbUser).asJson(),
    );

    // CSRF Token passed as cookie
    cookieForUI(request, reply, CSRF_TOKEN_COOKIE_NAME, reply.generateCsrf());

    reply.redirect("/");
  });
};
