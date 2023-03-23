import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  ALLOWED_CHANGE_USER_PERMISSION,
  ALLOWED_CREATE_NEW_RELEASE,
  ALLOWED_DATASET_UPDATE,
  ALLOWED_OVERALL_ADMIN_VIEW,
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
import { UsersService } from "../business/services/users-service";
import { generators } from "openid-client";
import { isSuperAdmin } from "./session-cookie-route-hook";
import { AuditLogService } from "../business/services/audit-log-service";
import { AuthenticatedUser } from "../business/authenticated-user";
import {
  TEST_SUBJECT_1,
  TEST_SUBJECT_1_DISPLAY,
  TEST_SUBJECT_1_EMAIL,
  TEST_SUBJECT_2,
  TEST_SUBJECT_2_DISPLAY,
  TEST_SUBJECT_2_EMAIL,
  TEST_SUBJECT_3,
  TEST_SUBJECT_3_DISPLAY,
  TEST_SUBJECT_3_EMAIL,
} from "../test-data/insert-test-users";
import { cookieForBackend, cookieForUI } from "./helpers/cookie-helpers";
import { Client } from "edgedb";
import { Logger } from "pino";

function createClient(settings: ElsaSettings, redirectUri: string) {
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
  const settings = opts.container.resolve<ElsaSettings>("Settings");
  const dbClient = opts.container.resolve<Client>("Database");
  const logger = opts.container.resolve<Logger>("Logger");
  const userService = opts.container.resolve(UsersService);
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
        dbClient,
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
    const subject1 = await userService.upsertUserForLogin(
      TEST_SUBJECT_1,
      TEST_SUBJECT_1_DISPLAY,
      TEST_SUBJECT_1_EMAIL
    );
    const subject2 = await userService.upsertUserForLogin(
      TEST_SUBJECT_2,
      TEST_SUBJECT_2_DISPLAY,
      TEST_SUBJECT_2_EMAIL
    );
    const subject3 = await userService.upsertUserForLogin(
      TEST_SUBJECT_3,
      TEST_SUBJECT_3_DISPLAY,
      TEST_SUBJECT_3_EMAIL
    );

    if (!subject1 || !subject2 || !subject3)
      throw new Error(
        "Test users not setup correctly in database even though they are meant to be enabled"
      );

    // register a login endpoint that sets a cookie without actual login
    // NOTE: this has to replicate all the real auth login steps (set the same cookies etc)
    const addTestUserRoute = (
      path: string,
      subjectId: string,
      name: string,
      email: string
    ) => {
      fastify.post(path, async (request, reply) => {
        const authUser = await userService.upsertUserForLogin(
          subjectId,
          name,
          email
        );

        logger.warn(
          `addTestUserRoute: executing login bypass route ${path} - this should only be occurring in locally deployed dev instances`
        );

        cookieForBackend(
          request,
          reply,
          SESSION_TOKEN_PRIMARY,
          "Thiswouldneedtobearealbearertokenforexternaldata"
        );
        cookieForBackend(
          request,
          reply,
          SESSION_USER_DB_OBJECT,
          authUser.asJson()
        );

        // these cookies however are available to React - PURELY for UI/display purposes
        cookieForUI(
          request,
          reply,
          USER_SUBJECT_COOKIE_NAME,
          authUser.subjectId
        );
        cookieForUI(
          request,
          reply,
          USER_NAME_COOKIE_NAME,
          authUser.displayName
        );
        cookieForUI(request, reply, USER_EMAIL_COOKIE_NAME, authUser.email);

        const allowed = new Set<string>();

        if (authUser.isAllowedCreateRelease) {
          allowed.add(ALLOWED_CREATE_NEW_RELEASE);
        }

        if (authUser.isAllowedRefreshDatasetIndex) {
          allowed.add(ALLOWED_DATASET_UPDATE);
        }

        if (
          authUser.isAllowedChangeUserPermission ||
          authUser.isAllowedOverallAdministratorView
        ) {
          allowed.add(ALLOWED_OVERALL_ADMIN_VIEW);
        }

        if (authUser.isAllowedChangeUserPermission) {
          allowed.add(ALLOWED_CHANGE_USER_PERMISSION);
        }

        cookieForUI(
          request,
          reply,
          USER_ALLOWED_COOKIE_NAME,
          Array.from(allowed.values()).join(",")
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

    // a test user that is in charge of a few datasets
    addTestUserRoute(
      "/login-bypass-1",
      TEST_SUBJECT_1,
      TEST_SUBJECT_1_DISPLAY,
      TEST_SUBJECT_1_EMAIL
    );
    // a test user that is a Manager in some releases
    addTestUserRoute(
      "/login-bypass-2",
      TEST_SUBJECT_2,
      TEST_SUBJECT_2_DISPLAY,
      TEST_SUBJECT_2_EMAIL
    );
    // a test user that is a super admin equivalent
    addTestUserRoute(
      "/login-bypass-3",
      TEST_SUBJECT_3,
      TEST_SUBJECT_3_DISPLAY,
      TEST_SUBJECT_3_EMAIL
    );
  }
};

export const callbackRoutes = async (
  fastify: FastifyInstance,
  opts: {
    // DI resolver
    container: DependencyContainer;
    redirectUri: string;
    includeTestUsers: boolean;
  }
) => {
  const settings = opts.container.resolve<ElsaSettings>("Settings");
  const userService = opts.container.resolve(UsersService);

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

    const displayName = idClaims.name || "No Display Name";
    const email = idClaims.email || "No Email";

    const authUser = await userService.upsertUserForLogin(
      idClaims.sub,
      displayName,
      email
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
    cookieForUI(request, reply, USER_EMAIL_COOKIE_NAME, email); // TODO: save this in backend too.. (if needed?)

    // NOTE: this is a UI cookie - the actual enforcement of this grouping at an API layer is elsewhere
    // we do it this way so that we can centralise all permissions logic on the backend, and hand down
    // simple "is allowed" decisions to the UI
    // MAKE SURE ALL THE DECISIONS HERE MATCH THE API AUTH LOGIC - THAT IS THE POINT OF THIS TECHNIQUE
    const allowed = new Set<string>();

    if (authUser.isAllowedCreateRelease) {
      allowed.add(ALLOWED_CREATE_NEW_RELEASE);
    }

    if (authUser.isAllowedRefreshDatasetIndex) {
      allowed.add(ALLOWED_DATASET_UPDATE);
    }

    if (
      authUser.isAllowedChangeUserPermission ||
      authUser.isAllowedOverallAdministratorView
    ) {
      allowed.add(ALLOWED_OVERALL_ADMIN_VIEW);
    }

    if (authUser.isAllowedChangeUserPermission) {
      allowed.add(ALLOWED_CHANGE_USER_PERMISSION);
    }

    cookieForUI(
      request,
      reply,
      USER_ALLOWED_COOKIE_NAME,
      Array.from(allowed.values()).join(",")
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
