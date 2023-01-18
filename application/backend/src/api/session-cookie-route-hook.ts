import { FastifyReply, FastifyRequest } from "fastify";
import {
  SESSION_TOKEN_PRIMARY,
  SESSION_USER_DB_OBJECT,
} from "./session-cookie-constants";
import { UsersService } from "../business/services/users-service";
import { ElsaSettings } from "../config/elsa-settings";
import { AuthenticatedUser } from "../business/authenticated-user";
import { SingleUserBySubjectIdType } from "../business/db/user-queries";
import { SecureSessionPluginOptions } from "@fastify/secure-session";
import { SECURE_COOKIE_NAME } from "@umccr/elsa-constants";

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
export function createSessionCookieRouteHook(
  usersService: UsersService,
  allowSessionCookieUserNotMatchingDb: boolean
  // allowTestCookieEquals?: string
) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // if we are in test mode - then we want to accept a manually constructed cookie in lieu of a real
      // session cookie - so we can simulate with Postman/Curl etc
      // TODO - the cookie will have to allow us as testers to set group info etc
      /* NOT CURRENTLY BEING USED Jan 2023 - disabling and if no use cases arise then delete
        if (allowTestCookieEquals) {
        const rawCookie = request.cookies[SESSION_TOKEN_PRIMARY];

        if (rawCookie == allowTestCookieEquals) {
          // setup up the fake authed user
          (request as any).user = await usersService.getBySubjectId(
            "http://subject1.com"
          );
          return;
        }
      } */

      // TODO: get all the HTTP return codes correct

      // NOTE: in some dev scenarios we need to correct this session object - hence the let, not const
      let sessionDbObject: SingleUserBySubjectIdType = request.session.get(
        SESSION_USER_DB_OBJECT
      );

      // TODO: consider do we really need this check? This is really a bearer token *out* into the passport/visa
      // and that's not what we are checking in this hook
      const sessionTokenPrimary = request.session.get(SESSION_TOKEN_PRIMARY);

      if (!sessionTokenPrimary || !sessionDbObject) {
        request.log.error(
          "createSessionCookieRouteHook: no session cookie data present so failing authentication"
        );

        return reply.code(401).send();
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
          request.log.debug(
            `Did a test scenario correction of the database id of the logged in user ${sessionDbObject.id} to ${testDbUserDirectFromDb?.dbId}`
          );
          sessionDbObject = testDbUserDirectFromDb.asJson();
          request.session.set(SESSION_USER_DB_OBJECT, sessionDbObject);
        }
      }

      const authedUser = new AuthenticatedUser(sessionDbObject);

      request.log.trace(
        authedUser,
        `createSessionCookieRouteHook: user details`
      );

      // set the full authenticated user into the request state for the rest of the request handling
      (request as any).user = authedUser;
    } catch (error) {
      request.log.error(error, "createSessionCookieRouteHook: overall error");

      // we are interpreting a failure here as an authentication failure 401
      // (where are 403 would have meant we parsed all the auth data, but then decided to reject it)
      reply.code(401).send();
    }
  };
}
