import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  SESSION_DB_ID,
  SESSION_DISPLAY_NAME,
  SESSION_SUBJECT_ID,
  SESSION_TOKEN_PRIMARY,
} from "./auth-constants";
import { UsersService } from "../business/services/users-service";
import { ElsaSettings } from "../config/elsa-settings";
import { AuthenticatedUser } from "../business/authenticated-user";

export type FastifyRequestAuthed = FastifyRequest & { user: AuthenticatedUser };

export function isSuperAdmin(settings: ElsaSettings, user: AuthenticatedUser) {
  for (const sa of settings.superAdmins || []) {
    if (sa.id === user.subjectId) return true;
  }
  return false;
}

/**
 * Creates a hook that does a barrier check on super admin functionality.
 *
 * @param settings
 */
export function createSuperAdminAuthRouteHook(settings: ElsaSettings) {
  return async (request: FastifyRequestAuthed, reply: FastifyReply) => {
    if (!request.user) throw Error("Shouldn't be able to happen");

    const isa = isSuperAdmin(settings, request.user);

    if (!isa) {
      reply.code(403).send();
      // to be really clear - we aren't proceeding or doing anything else as the person is not superadmin
      return;
    }
  };
}

/**
 * Creates a hook that does all the auth setup for each authenticated request (cookie handling etc).
 */
export function createAuthRouteHook(
  usersService: UsersService,
  allowTestCookieEquals?: string
) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // if we are in test mode - then we want to accept a manually constructed cookie in lieu of a real
      // session cookie - so we can simulate with Postman/Curl etc
      // TODO - the cookie will have to allow us as testers to set group info etc
      if (allowTestCookieEquals) {
        const rawCookie = request.cookies[SESSION_TOKEN_PRIMARY];

        if (rawCookie == allowTestCookieEquals) {
          // setup up the fake authed user
          (request as any).user = await usersService.getBySubjectId(
            "http://subject1.com"
          );
          return;
        }
      }

      // TODO: get all the return codes correct

      const sessionTokenPrimary = request.session.get(SESSION_TOKEN_PRIMARY);
      const sessionDbId = request.session.get(SESSION_DB_ID);
      const sessionSubjectId = request.session.get(SESSION_SUBJECT_ID);
      const sessionDisplayName = request.session.get(SESSION_DISPLAY_NAME);

      if (
        !sessionTokenPrimary ||
        !sessionDbId ||
        !sessionSubjectId ||
        !sessionDisplayName
      ) {
        console.log("NO SESSSION COOKIE DATA PRESENT TO ENABLE AUTH");
        reply.code(403).send();
        return;
      }

      const authedUser = new AuthenticatedUser({
        id: sessionDbId,
        subjectId: sessionSubjectId,
        displayName: sessionDisplayName,
      });

      console.log(`Auth route hook for user ${authedUser}`);

      (request as any).user = authedUser;
    } catch (error) {
      console.log(error);
      reply.code(403).send();
    }
  };
}
