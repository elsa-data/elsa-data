import type { FastifyReply, FastifyRequest } from "fastify";
import type { AuthenticatedUserJsonType } from "../../business/authenticated-user";
import {
  SESSION_GLOBUS_RELEASE_KEY_NAME,
  SESSION_GLOBUS_STATE_KEY_NAME,
  SESSION_GLOBUS_TOKEN_KEY_NAME,
  type SESSION_KEYS,
  SESSION_OIDC_NONCE_KEY_NAME,
  SESSION_OIDC_STATE_KEY_NAME,
  SESSION_USER_DB_OBJECT_KEY_NAME,
} from "../auth/session-cookie-constants";

declare module "@fastify/secure-session" {
  interface SessionData {
    [SESSION_USER_DB_OBJECT_KEY_NAME]: AuthenticatedUserJsonType;
    [SESSION_OIDC_NONCE_KEY_NAME]: string;
    [SESSION_OIDC_STATE_KEY_NAME]: string;
    [SESSION_GLOBUS_STATE_KEY_NAME]: string;
    [SESSION_GLOBUS_TOKEN_KEY_NAME]: string;
    [SESSION_GLOBUS_RELEASE_KEY_NAME]: string;
  }
}

/**
 * Set a cookie for use in a frontend UI.
 *
 * @param request
 * @param reply
 * @param k
 * @param v
 */
export function cookieForUI(
  request: FastifyRequest,
  reply: FastifyReply,
  k: string,
  v: string,
) {
  return reply.setCookie(k, v, {
    path: "/",
    secure: true,
    httpOnly: false,
    maxAge: 24 * 60 * 60, // 1 day (in seconds)
  });
}

/**
 * Set a cookie for use in a backend.
 *
 * @param request
 * @param reply
 * @param k
 * @param v
 */
export function cookieBackendSessionSetKeyValue(
  request: FastifyRequest,
  reply: FastifyReply,
  k: SESSION_KEYS,
  v: any,
) {
  request.session.options({
    maxAge: 24 * 60 * 60, // 1 day (in seconds); Documented in "SECURITY.md" please update accordingly.
  });
  request.session.set(k, v);
}
