import * as edgedb from "edgedb";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  ALLOWED_CHANGE_ADMINS,
  ALLOWED_CREATE_NEW_RELEASES,
  SECURE_COOKIE_NAME,
  USER_ALLOWED_COOKIE_NAME,
  USER_EMAIL_COOKIE_NAME,
  USER_NAME_COOKIE_NAME,
  USER_SUBJECT_COOKIE_NAME,
} from "@umccr/elsa-constants";
import { SecureSessionPluginOptions } from "@fastify/secure-session";
import {
  SESSION_TOKEN_PRIMARY,
  SESSION_USER_DB_OBJECT,
} from "./auth-constants";
import { ElsaSettings } from "../config/elsa-settings";
import { DependencyContainer } from "tsyringe";
import { UsersService } from "../business/services/users-service";
import { generators } from "openid-client";
import { isSuperAdmin } from "./auth-route-hook";
import {
  TEST_SUBJECT_1,
  TEST_SUBJECT_2,
  TEST_SUBJECT_3,
} from "../test-data/insert-test-data";
import { AuditLogService } from "../business/services/audit-log-service";
import { AuthenticatedUser } from "../business/authenticated-user";

/**
 * Return a secure sessions plugin options object.
 * NOTES: the code is here just so all the auth stuff is in one spot.

 * @param settings
 */
export function getSecureSessionOptions(
  settings: ElsaSettings
): SecureSessionPluginOptions {
  return {
    secret: settings.sessionSecret,
    salt: settings.sessionSalt,
    cookieName: SECURE_COOKIE_NAME,
    cookie: {
      // use across the entire site
      path: "/",
      // even though the session cookie is strongly encrypted - we also mind as well restrict it to https
      secure: true,
      // the session cookie is for use by the backend - not by frontend code
      httpOnly: true,
    },
  };
}

/**
 * Set a cookie for use in a frontend UI.
 *
 * @param request
 * @param reply
 * @param k
 * @param v
 */
const cookieForUI = (
  request: FastifyRequest,
  reply: FastifyReply,
  k: string,
  v: string
) => {
  return reply.setCookie(k, v, {
    path: "/",
    secure: true,
    httpOnly: false,
    maxAge: 24 * 60 * 60, // 1 day (in seconds)
  });
};

/**
 * Set a cookie for use in a backend.
 *
 * @param request
 * @param reply
 * @param k
 * @param v
 */
const cookieForBackend = (
  request: FastifyRequest,
  reply: FastifyReply,
  k: string,
  v: any
) => {
  request.session.options({
    maxAge: 24 * 60 * 60, // 1 day (in seconds)
  });
  request.session.set(k, v);
};

/**
 * Register all routes directly to do with the authz systems.
 *
 * @param fastify the fastify instance
 * @param opts options for establishing this route
 */
export const authRoutes = async (
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
  const auditLogService = opts.container.resolve(AuditLogService);

  const client = new settings.oidcIssuer.Client({
    client_id: settings.oidcClientId,
    client_secret: settings.oidcClientSecret,
    redirect_uris: [opts.redirectUri],
    response_types: ["code"],
    token_endpoint_auth_method: "client_secret_post",
  });

  // the login route is the route posted to by the client to initiate a login
  // it constructs the appropriate auth url (as known to the backend only)
  // and sends it back to the client as a redirect to start the oidc flow
  fastify.post("/auth/login", async (request, reply) => {
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
  const clearOurLoginState = (request: FastifyRequest, reply: FastifyReply) => {
    // delete all the backend session cookies
    request.session.delete();

    reply.clearCookie(USER_SUBJECT_COOKIE_NAME);
    reply.clearCookie(USER_NAME_COOKIE_NAME);
    reply.clearCookie(USER_EMAIL_COOKIE_NAME);
    reply.clearCookie(USER_ALLOWED_COOKIE_NAME);
  };

  fastify.post("/auth/logout", async (request, reply) => {
    clearOurLoginState(request, reply);
    reply.redirect("/");
  });

  fastify.post("/auth/logout-completely", async (request, reply) => {
    clearOurLoginState(request, reply);

    // TODO: this probably needs to be configurable per OIDC setup - but given we are setting
    // up firstly for CILogon - it can wait till after that

    // CILogon has a special page to visit that clears CILogon cookie state
    reply.redirect("https://cilogon.org/logout");
  });

  // the cb (callback) route is the route that is redirected to as part of the OIDC flow
  // it expects a 'code' parameter on the URL and uses that to get a token set
  // from the OIDC flow
  fastify.get("/cb", async (request, reply) => {
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

    console.log(
      `Login event for ${authUser.dbId} ${authUser.subjectId} ${authUser.displayName}`
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

    // the super admins are defined in settings/config - not in the db
    // that is - they are a deployment instance level setting
    const isa = isSuperAdmin(settings, authUser);

    if (isa) {
      allowed.add(ALLOWED_CHANGE_ADMINS);
      // for the moment if we want to do demos it is easy if the super admins get all the functionality
      allowed.add(ALLOWED_CREATE_NEW_RELEASES);
    }

    // some garbage temporary logic for giving extra permissions to some people
    // this would normally come via group info
    if (email.endsWith("unimelb.edu.au"))
      allowed.add(ALLOWED_CREATE_NEW_RELEASES);

    cookieForUI(
      request,
      reply,
      USER_ALLOWED_COOKIE_NAME,
      Array.from(allowed.values()).join(",")
    );

    reply.redirect("/");
  });

  if (opts.includeTestUsers) {
    // TODO unify this with the other test user insertion code
    const subject1 = await userService.upsertUserForLogin(
      TEST_SUBJECT_1,
      "Test Subject 1",
      "test@example.com"
    );
    const subject2 = await userService.upsertUserForLogin(
      TEST_SUBJECT_2,
      "Test Subject 2",
      "test2@example.com"
    );
    const subject3 = await userService.upsertUserForLogin(
      TEST_SUBJECT_3,
      "Test Subject 3",
      "test3@example.com"
    );

    if (!subject1 || !subject2 || !subject3)
      throw new Error(
        "Test users not setup correctly in database even though they are meant to be enabled"
      );

    // register a login endpoint that sets a cookie without actual login
    // NOTE: this has to replicate all the real auth login steps (set the same cookies etc)
    const addTestUserRoute = (
      path: string,
      authUser: AuthenticatedUser,
      allowed: string[]
    ) => {
      fastify.post(path, async (request, reply) => {
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
        cookieForUI(request, reply, USER_EMAIL_COOKIE_NAME, "user@email.com");
        cookieForUI(
          request,
          reply,
          USER_ALLOWED_COOKIE_NAME,
          allowed.join(",")
        );

        reply.redirect("/");
      });
    };

    // a test user that is in charge of a few datasets
    addTestUserRoute("/auth/login-bypass-1", subject1, [
      ALLOWED_CREATE_NEW_RELEASES,
    ]);
    // a test user that is a PI in some releases
    addTestUserRoute("/auth/login-bypass-2", subject2, []);
    // a test user that is a super admin equivalent
    addTestUserRoute("/auth/login-bypass-3", subject3, [ALLOWED_CHANGE_ADMINS]);
  }
};
