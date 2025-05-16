import type { SecureSessionPluginOptions } from "@fastify/secure-session";
import type { FastifyRequest } from "fastify";
import {
  AuthenticatedUser,
  type AuthenticatedUserJsonType,
} from "../../business/authenticated-user";
import { UserService } from "../../business/services/user-service";
import type { ElsaSettings } from "../../config/elsa-settings";
import { SECURE_COOKIE_NAME } from "../../shared/constants-cookies";
import { SESSION_USER_DB_OBJECT_KEY_NAME } from "./session-cookie-constants";

/**
 * Return a secure sessions plugin options object for Fastify.

 * @param settings our Elsa Settings that are used to create the session crypto
 */
export function getSecureSessionOptions(
  settings: ElsaSettings,
): SecureSessionPluginOptions {
  return {
    secret: settings.httpHosting.session.secret,
    salt: settings.httpHosting.session.salt,
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
 * From a previously established secure cookie, return an AuthenticatedUser
 * object, or null if this could not be done.
 *
 * @param userService
 * @param request
 */
export function getAuthenticatedUserFromSecureSession(
  userService: UserService,
  request: FastifyRequest,
): AuthenticatedUser | null {
  // cannot return authenticated users if our session management was not installed
  if (!request.session) return null;

  const sessionDbObject: AuthenticatedUserJsonType | undefined =
    request.session.get(SESSION_USER_DB_OBJECT_KEY_NAME);

  // cannot return authenticated user if no session cookie has been created
  if (!sessionDbObject) return null;

  // create a strongly typed object from the session data
  return new AuthenticatedUser(sessionDbObject);
}
