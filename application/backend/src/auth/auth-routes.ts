import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  SECURE_COOKIE_NAME,
  USER_NAME_COOKIE_NAME,
  USER_SUBJECT_COOKIE_NAME,
} from "@umccr/elsa-constants";
import { SecureSessionPluginOptions } from "@fastify/secure-session";
import { TOKEN_PRIMARY } from "./auth-strings";
import { ElsaSettings } from "../config/elsa-settings";
import { DependencyContainer } from "tsyringe";
import { UsersService } from "../business/services/users-service";
import { isNil } from "lodash";
import { generators } from "openid-client";

type Opts = {
  container: DependencyContainer;
  redirectUri: string;
  includeTestUsers: boolean;
};

export function getSecureSessionOptions(
  settings: ElsaSettings
): SecureSessionPluginOptions {
  return {
    secret: settings.sessionSecret,
    salt: settings.sessionSalt,
    cookieName: SECURE_COOKIE_NAME,
    cookie: {
      path: "/",
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
    secure: true,
    httpOnly: false,
    path: "/",
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

export const authRoutes = async (fastify: FastifyInstance, opts: Opts) => {
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
      scope: "openid email profile org.cilogon.userinfo",
      // nonce: nonce,
      // state: "ABCD",
    });
    reply.redirect(redirectUrl);
  });

  fastify.post("/auth/logout", async (request, reply) => {
    request.session.delete();

    reply.clearCookie(USER_SUBJECT_COOKIE_NAME);
    reply.clearCookie(USER_NAME_COOKIE_NAME);

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

    const authUser = await userService.upsertUser(idClaims.sub, displayName);

    if (!authUser)
      // TODO: redirect to a static error page?
      reply.redirect("/error");
    else {
      // the secure session token is HTTP only - so its existence can't even be tracked in
      // the React code - it is made available to the backend that can use it as a
      // real access token
      cookieForBackend(request, reply, TOKEN_PRIMARY, tokenSet.access_token!);

      // these cookies however are available to React - PURELY for UI/display purposes
      cookieForUI(request, reply, USER_SUBJECT_COOKIE_NAME, authUser.subjectId);
      cookieForUI(request, reply, USER_NAME_COOKIE_NAME, authUser.displayName);

      reply.redirect("/");
    }
  });

  if (opts.includeTestUsers) {
    // register a login endpoint that sets a cookie without actual login
    fastify.post("/auth/login-bypass-1", async (request, reply) => {
      cookieForBackend(request, reply, TOKEN_PRIMARY, {
        id: "http://subject1.com",
      });

      // these cookies however are available to React - PURELY for UI/display purposes
      cookieForUI(
        request,
        reply,
        USER_SUBJECT_COOKIE_NAME,
        "http://subject1.com"
      );
      cookieForUI(request, reply, USER_NAME_COOKIE_NAME, "Test User 1");

      reply.redirect("/");
    });

    // register a login endpoint that sets a cookie without actual login
    fastify.post("/auth/login-bypass-2", async (request, reply) => {
      cookieForBackend(request, reply, TOKEN_PRIMARY, {
        id: "http://subject2.com",
      });

      // these cookies however are available to React - PURELY for UI/display purposes
      cookieForUI(
        request,
        reply,
        USER_SUBJECT_COOKIE_NAME,
        "http://subject2.com"
      );
      cookieForUI(request, reply, USER_NAME_COOKIE_NAME, "Test User 2");

      reply.redirect("/");
    });
  }
};
