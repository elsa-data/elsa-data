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
      // NOTE: in some test scenarios we need to correct this session db id - hence the let
      let sessionDbId = request.session.get(SESSION_DB_ID);
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

      // if we are in testing mode - then on every request we take an *extra* step to
      // 'correct' the database id of cookie user
      // this is because when doing dev work - the underlying db user can change when the
      // server restarts
      // we obviously don't want to do this when connected to a real database
      if (allowTestCookieEquals) {
        const testDbUserDirectFromDb = await usersService.getBySubjectId(
          sessionSubjectId
        );
        if (!testDbUserDirectFromDb)
          throw new Error(
            "Serious test scenario state error as the test subjects have disappeared"
          );

        if (testDbUserDirectFromDb?.dbId != sessionDbId) {
          console.log(
            `Did a test scenario correction of the database id of the logged in user ${sessionDbId} to ${testDbUserDirectFromDb?.dbId}`
          );
          request.session.set(SESSION_DB_ID, testDbUserDirectFromDb?.dbId);
          sessionDbId = testDbUserDirectFromDb?.dbId;
        }
      }

      const authedUser = new AuthenticatedUser({
        id: sessionDbId,
        subjectId: sessionSubjectId,
        displayName: sessionDisplayName,
      });

      console.log(`Auth route hook for user ${JSON.stringify(authedUser)}`);

      (request as any).user = authedUser;
    } catch (error) {
      console.log(error);
      reply.code(403).send();
    }
  };
}
