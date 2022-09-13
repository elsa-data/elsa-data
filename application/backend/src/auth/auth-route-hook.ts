import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import {
  SESSION_TOKEN_PRIMARY,
  SESSION_USER_DB_OBJECT,
} from "./auth-constants";
import { UsersService } from "../business/services/users-service";
import { ElsaSettings } from "../config/elsa-settings";
import { AuthenticatedUser } from "../business/authenticated-user";
import { SingleUserBySubjectIdType } from "../business/db/user-queries";

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
/*export function createSuperAdminAuthRouteHook(settings: ElsaSettings) {
  return async (request: FastifyRequestAuthed, reply: FastifyReply) => {
    if (!request.user) throw Error("Shouldn't be able to happen");

    const isa = isSuperAdmin(settings, request.user);

    if (!isa) {
      reply.code(403).send();
      // to be really clear - we aren't proceeding or doing anything else as the person is not superadmin
      return;
    }
  };
}*/

/**
 * Creates a hook that does all the auth setup for each request needing authenticated users (does the cookie handling,
 * creating a User object etc). This hook is a barrier function to all routes registered
 * on it - that is - it prevents any unauthenticated requests from continuing.
 *
 * @param usersService the Users service
 * @param allowSessionCookieUserNotMatchingDb if true, then do an extra check to make sure the session user matches the same user in the database (needed where the dev db can refresh)
 * @param allowTestCookieEquals if the primary session token is present with this value - create a test user
 */
export function createAuthRouteHook(
  usersService: UsersService,
  allowSessionCookieUserNotMatchingDb: boolean,
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

      // TODO: get all the HTTP return codes correct

      // NOTE: in some dev scenarios we need to correct this session object - hence the let, not const
      let sessionDbObject: SingleUserBySubjectIdType = request.session.get(
        SESSION_USER_DB_OBJECT
      );

      // TODO: consider do we really need this check? This is really a bearer token *out* into the passport/visa
      // and that's not what we are checking in this hook
      const sessionTokenPrimary = request.session.get(SESSION_TOKEN_PRIMARY);

      if (!sessionTokenPrimary || !sessionDbObject) {
        console.log("NO SESSSION COOKIE DATA PRESENT TO ENABLE AUTH");
        reply.code(403).send();
        return;
      }

      // if we are in testing mode - then on every request we take an *extra* step to
      // 'correct' the database id of cookie user
      // this is because when doing dev work - the underlying db user can change when the
      // server restarts
      // we obviously don't want to do this when connected to a real database
      if (allowSessionCookieUserNotMatchingDb) {
        const testDbUserDirectFromDb = await usersService.getBySubjectId(
          sessionDbObject.subjectId
        );
        if (!testDbUserDirectFromDb)
          throw new Error(
            "Serious test scenario state error as the test subjects have disappeared"
          );

        if (testDbUserDirectFromDb?.dbId != sessionDbObject.id) {
          console.log(
            `Did a test scenario correction of the database id of the logged in user ${sessionDbObject.id} to ${testDbUserDirectFromDb?.dbId}`
          );
          sessionDbObject = testDbUserDirectFromDb.asJson();
          request.session.set(SESSION_USER_DB_OBJECT, sessionDbObject);
        }
      }

      const authedUser = new AuthenticatedUser(sessionDbObject);

      console.log(`Auth route hook for user ${JSON.stringify(authedUser)}`);

      // set the full authenticated user into the request state for the rest of the request handling
      (request as any).user = authedUser;
    } catch (error) {
      console.log(error);
      reply.code(403).send();
    }
  };
}
