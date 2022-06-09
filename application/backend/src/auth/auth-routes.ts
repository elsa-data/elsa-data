import { FastifyInstance } from "fastify";
import {
  SECURE_COOKIE_NAME,
  USER_NAME_COOKIE_NAME,
  USER_SUBJECT_COOKIE_NAME,
} from "@umccr/elsa-strings";
import { SecureSessionPluginOptions } from "@fastify/secure-session";
import { ElsaSettings } from "../bootstrap-settings";
import { TOKEN_PRIMARY } from "./auth-strings";

type Opts = {
  settings: ElsaSettings;
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

export const authRoutes = async (fastify: FastifyInstance, opts: Opts) => {
  const client = new opts.settings.oidcIssuer.Client({
    client_id: opts.settings.oidcClientId,
    client_secret: opts.settings.oidcClientSecret,
    redirect_uris: [opts.redirectUri],
    response_types: ["code"],
    token_endpoint_auth_method: "client_secret_post",
  });

  fastify.post("/auth/login", async (request, reply) => {
    const redirectUrl = client.authorizationUrl({
      scope: "openid email profile",
      //state: "ABCD",
      // resource: 'https://my.api.example.com/resource/32178',
    });
    reply.redirect(redirectUrl);
  });

  fastify.post("/auth/logout", async (request, reply) => {
    request.session.delete();

    reply.clearCookie(USER_SUBJECT_COOKIE_NAME);
    reply.clearCookie(USER_NAME_COOKIE_NAME);

    reply.redirect("/");
  });

  if (opts.includeTestUsers) {
    // register a login endpoint that sets a cookie without actual login
    fastify.post("/auth/login-bypass-1", async (request, reply) => {
      request.session.set(TOKEN_PRIMARY, "This is not a real access token");

      // these cookies however are available to React - PURELY for UI/display purposes
      reply.setCookie(USER_SUBJECT_COOKIE_NAME, "http://subject1.com", {
        secure: true,
        httpOnly: false,
      });
      reply.setCookie(USER_NAME_COOKIE_NAME, "Test User", {
        secure: true,
        httpOnly: false,
      });

      reply.redirect("/");
    });
  }

  fastify.get("/cb", async (request, reply) => {
    const params = client.callbackParams(request.raw);

    const tokenSet = await client.callback(opts.redirectUri, params);

    // the secure session token is HTTP only - so its existence can't even be tracked in
    // the React code
    request.session.set(TOKEN_PRIMARY, tokenSet.access_token);

    // these cookies however are available to React - PURELY for UI/display purposes
    reply.setCookie(USER_SUBJECT_COOKIE_NAME, tokenSet.claims().sub, {
      secure: true,
      httpOnly: false,
    });
    reply.setCookie(
      USER_NAME_COOKIE_NAME,
      tokenSet.claims().name || "(no display name)",
      {
        secure: true,
        httpOnly: false,
      }
    );

    reply.redirect("/");
  });
};
