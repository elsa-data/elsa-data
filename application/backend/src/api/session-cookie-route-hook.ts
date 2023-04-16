import { FastifyReply, FastifyRequest } from "fastify";
import { UsersService } from "../business/services/users-service";
import { getAuthenticatedUserFromSecureSession } from "./auth/session-cookie-helpers";
import { createUserAllowedCookie } from "./helpers/cookie-helpers";
import { NotAuthorisedCredentials } from "./errors/authentication-error";

/**
 * Creates a hook that does all the auth setup for each request needing authenticated users (does the cookie handling,
 * creating a User object etc). This hook is a barrier function to all routes registered
 * on it - that is - it prevents any unauthenticated requests from continuing. The authentication
 * that is required for this hook is that which is setup for internal use i.e. login and cookie sessions.
 *
 * @param usersService the Users service
 */
export function createSessionCookieRouteHook(usersService: UsersService) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const authedUser = getAuthenticatedUserFromSecureSession(
      usersService,
      request
    );
    if (!authedUser) throw new NotAuthorisedCredentials();
    request.log.trace(authedUser, `createSessionCookieRouteHook: user details`);

    const dbUser = await usersService.getBySubjectId(authedUser.subjectId);
    if (!dbUser) throw new NotAuthorisedCredentials();
    request.log.trace(dbUser, `databaseUser: user details`);

    // Check for permissions different
    const dbPermission = createUserAllowedCookie(
      usersService.isConfiguredSuperAdmin(dbUser.subjectId),
      dbUser
    );
    const sessionPermission = createUserAllowedCookie(
      usersService.isConfiguredSuperAdmin(authedUser.subjectId),
      authedUser
    );
    if (dbPermission != sessionPermission) {
      throw new NotAuthorisedCredentials(
        "User permissions have changed. Please try logging back in!"
      );
    }

    // set the full authenticated user into the request state for the rest of the request handling
    (request as any).user = authedUser;
  };
}
