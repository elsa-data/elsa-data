import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  ALLOWED_CHANGE_ADMINS,
  ALLOWED_CREATE_NEW_RELEASES,
  SECURE_COOKIE_NAME,
  USER_ALLOWED_COOKIE_NAME,
  USER_NAME_COOKIE_NAME,
  USER_SUBJECT_COOKIE_NAME,
} from "@umccr/elsa-constants";
import { SecureSessionPluginOptions } from "@fastify/secure-session";
import {
  SESSION_DB_ID,
  SESSION_DISPLAY_NAME,
  SESSION_SUBJECT_ID,
  SESSION_TOKEN_PRIMARY,
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

  fastify.post("/auth/logout", async (request, reply) => {
    request.session.delete();

    reply.clearCookie(USER_SUBJECT_COOKIE_NAME);
    reply.clearCookie(USER_NAME_COOKIE_NAME);
    reply.clearCookie(USER_ALLOWED_COOKIE_NAME);

    reply.redirect("/");
  });

  // the cb (callback) route is the route that is redirected to as part of the OIDC flow
  // it expects a 'code' parameter on the URL and uses that to get a token set
  // from the oidc flow
  fastify.get("/cb", async (request, reply) => {
    const params = client.callbackParams(request.raw);

    const tokenSet = await client.callback(opts.redirectUri, params, {
      // nonce: request.session.get("nonce"),
    });

    const idClaims = tokenSet.claims();

    const displayName = idClaims.name || "No Display Name";
    // TODO we don't save email yet - but we should
    const email = idClaims.email || "No Email";

    const authUser = await userService.upsertUser(idClaims.sub, displayName);

    if (!authUser)
      // TODO: redirect to a static error page?
      reply.redirect("/error");
    else {
      console.log(
        `Login event for ${authUser.dbId} ${authUser.subjectId} ${authUser.displayName}`
      );

      // the secure session token is HTTP only - so its existence can't even be tracked in
      // the React code - it is made available to the backend that can use it as a
      // real access token
      // we also make available all our AuthenticatedUser variables so we can make an
      // auth user on each API call - without hitting the db
      cookieForBackend(
        request,
        reply,
        SESSION_TOKEN_PRIMARY,
        tokenSet.access_token!
      );
      cookieForBackend(request, reply, SESSION_DB_ID, authUser.dbId);
      cookieForBackend(request, reply, SESSION_SUBJECT_ID, authUser.subjectId);
      cookieForBackend(
        request,
        reply,
        SESSION_DISPLAY_NAME,
        authUser.displayName
      );

      // these cookies however are available to React - PURELY for UI/display purposes
      cookieForUI(request, reply, USER_SUBJECT_COOKIE_NAME, authUser.subjectId);
      cookieForUI(request, reply, USER_NAME_COOKIE_NAME, authUser.displayName);

      // NOTE: this is a UI cookie - the actual enforcement of this grouping at an API layer is elsewhere
      // we do it this way so that we can centralise all permissions logic on the backend, and hand down
      // simple "is allowed" decisions to the UI
      // MAKE SURE ALL THE DECISIONS HERE MATCH THE API AUTH LOGIC - THAT IS THE POINT OF THIS TECHNIQUE
      const allowed = new Set<string>();

      // the super admins are defined in settings/config - not in the db
      // that is - they are a deployment instance level setting
      const isa = isSuperAdmin(settings, authUser);

      if (isa) allowed.add(ALLOWED_CHANGE_ADMINS);

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
    }
  });

  if (opts.includeTestUsers) {
    const subject1 = await userService.getBySubjectId(TEST_SUBJECT_1);
    const subject2 = await userService.getBySubjectId(TEST_SUBJECT_2);
    const subject3 = await userService.getBySubjectId(TEST_SUBJECT_3);

    if (!subject1 || !subject2 || !subject3)
      throw new Error(
        "Test users not setup correctly in database even though they are meant to be enabled"
      );

    // register a login endpoint that sets a cookie without actual login
    // NOTE: this has to replicate all the real auth login steps (set the same cookies etc)
    const addTestUserRoute = (
      path: string,
      dbId: string,
      subjectId: string,
      displayName: string,
      allowed: string[]
    ) => {
      fastify.post(path, async (request, reply) => {
        cookieForBackend(
          request,
          reply,
          SESSION_TOKEN_PRIMARY,
          "Thiswouldneedtobearealbearertokenforexternaldata"
        );
        cookieForBackend(request, reply, SESSION_DB_ID, dbId);
        cookieForBackend(request, reply, SESSION_SUBJECT_ID, subjectId);
        cookieForBackend(request, reply, SESSION_DISPLAY_NAME, displayName);

        // these cookies however are available to React - PURELY for UI/display purposes
        cookieForUI(request, reply, USER_SUBJECT_COOKIE_NAME, subjectId);
        cookieForUI(request, reply, USER_NAME_COOKIE_NAME, displayName);
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
    addTestUserRoute(
      "/auth/login-bypass-1",
      subject1.dbId,
      TEST_SUBJECT_1,
      subject1.displayName,
      [ALLOWED_CREATE_NEW_RELEASES]
    );
    // a test user that is a PI in some releases
    addTestUserRoute(
      "/auth/login-bypass-2",
      subject2.dbId,
      TEST_SUBJECT_2,
      subject2.displayName,
      []
    );
    // a test user that is a super admin equivalent
    addTestUserRoute(
      "/auth/login-bypass-3",
      subject3.dbId,
      TEST_SUBJECT_3,
      subject3.displayName,
      [ALLOWED_CHANGE_ADMINS]
    );
  }
};
