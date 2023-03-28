import { FastifyReply, FastifyRequest } from "fastify";
import { UsersService } from "../business/services/users-service";
import { ElsaSettings } from "../config/elsa-settings";
import { AuthenticatedUser } from "../business/authenticated-user";
import { getAuthenticatedUserFromSecureSession } from "./auth/session-cookie-helpers";
import { createUserAllowedCookie } from "./helpers/cookie-helpers";
import { NotAuthorisedCredentials } from "./errors/authentication-error";

export function isSuperAdmin(settings: ElsaSettings, user: AuthenticatedUser) {
  for (const sa of settings.superAdmins || []) {
    if (sa.id === user.subjectId) return true;
  }
  return false;
}

/**
 * Creates a hook that does all the auth setup for each request needing authenticated users (does the cookie handling,
 * creating a User object etc). This hook is a barrier function to all routes registered
 * on it - that is - it prevents any unauthenticated requests from continuing. The authentication
 * that is required for this hook is that which is setup for internal use i.e. login and cookie sessions.
 *
 * @param usersService the Users service
 * @param allowSessionCookieUserNotMatchingDb if true, then do an extra check to make sure the session user matches the same user in the database (needed where the dev db can refresh)
 * // @param allowTestCookieEquals if the primary session token is present with this value - create a test user
 */
export function createSessionCookieRouteHook(usersService: UsersService) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const authedUser = getAuthenticatedUserFromSecureSession(request);
    if (!authedUser) throw new NotAuthorisedCredentials();

    const dbUser = await usersService.getBySubjectId(authedUser.subjectId);
    if (!dbUser) throw new NotAuthorisedCredentials();

    // Check for permissions different
    const dbPermission = createUserAllowedCookie(dbUser);
    const sessionPermission = createUserAllowedCookie(authedUser);
    if (dbPermission != sessionPermission) {
      throw new NotAuthorisedCredentials(
        "User permissions have changed. Please try logging back in!"
      );
    }

    // set the full authenticated user into the request state for the rest of the request handling
    (request as any).user = authedUser;
  };
}
