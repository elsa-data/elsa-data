import { FastifyInstance } from "fastify";
import {
  CSRF_TOKEN_COOKIE_NAME,
  USER_ALLOWED_COOKIE_NAME,
  USER_EMAIL_COOKIE_NAME,
  USER_NAME_COOKIE_NAME,
  USER_SUBJECT_COOKIE_NAME,
} from "@umccr/elsa-constants";
import {
  SESSION_TOKEN_PRIMARY,
  SESSION_USER_DB_OBJECT,
} from "./auth/session-cookie-constants";
import { DependencyContainer } from "tsyringe";
import { UserService } from "../business/services/user-service";
import {
  TEST_SUBJECT_1,
  TEST_SUBJECT_1_DISPLAY,
  TEST_SUBJECT_1_EMAIL,
  TEST_SUBJECT_2,
  TEST_SUBJECT_2_DISPLAY,
  TEST_SUBJECT_2_EMAIL,
  TEST_SUBJECT_3,
  TEST_SUBJECT_3_DISPLAY,
  TEST_SUBJECT_3_EMAIL,
} from "../test-data/insert-test-users";
import {
  cookieForBackend,
  cookieForUI,
  createUserAllowedCookie,
} from "./helpers/cookie-helpers";
import { getServices } from "../di-helpers";

/**
 * In test/dev, we can register a set of routes that allow us to directly
 * login as a set of known test users. This function both creates those
 * users in the database - with the correct initial settings/permissions,
 * and also adds the relevant fastify routes.
 *
 * @param fastify
 * @param opts
 */
export async function addTestUserRoutesAndActualUsers(
  fastify: FastifyInstance,
  opts: {
    // DI resolver
    container: DependencyContainer;
  }
) {
  const { logger } = getServices(opts.container);

  const userService = opts.container.resolve(UserService);

  const subject1 = await userService.upsertUserForLogin(
    TEST_SUBJECT_1,
    TEST_SUBJECT_1_DISPLAY,
    TEST_SUBJECT_1_EMAIL
  );
  const subject2 = await userService.upsertUserForLogin(
    TEST_SUBJECT_2,
    TEST_SUBJECT_2_DISPLAY,
    TEST_SUBJECT_2_EMAIL
  );
  const subject3 = await userService.upsertUserForLogin(
    TEST_SUBJECT_3,
    TEST_SUBJECT_3_DISPLAY,
    TEST_SUBJECT_3_EMAIL
  );

  if (!subject1 || !subject2 || !subject3)
    throw new Error(
      "Test users not setup correctly in database even though they are meant to be enabled"
    );

  // register a login endpoint that sets a cookie without actual login
  // NOTE: this has to replicate all the real auth login steps (set the same cookies etc)
  // MAKE SURE THIS IS KEPT IN SYNC WITH THE REAL AUTH LOGIN!!
  const addTestUserRoute = (
    path: string,
    subjectId: string,
    name: string,
    email: string
  ) => {
    fastify.post(path, async (request, reply) => {
      const authUser = await userService.upsertUserForLogin(
        subjectId,
        name,
        email
      );

      logger.warn(
        `addTestUserRoute: executing login bypass route ${path} - this should only be occurring in locally deployed dev instances`
      );

      cookieForBackend(
        request,
        reply,
        SESSION_TOKEN_PRIMARY,
        "Thiswouldneedtobearealbearertokenforexternaldata"
      );
      cookieForBackend(
        request,
        reply,
        SESSION_USER_DB_OBJECT,
        authUser.asJson()
      );

      // these cookies however are available to React - PURELY for UI/display purposes
      cookieForUI(request, reply, USER_SUBJECT_COOKIE_NAME, authUser.subjectId);
      cookieForUI(request, reply, USER_NAME_COOKIE_NAME, authUser.displayName);
      cookieForUI(request, reply, USER_EMAIL_COOKIE_NAME, authUser.email);

      const allowed = createUserAllowedCookie(
        userService.isConfiguredSuperAdmin(authUser.subjectId),
        authUser
      );

      cookieForUI(request, reply, USER_ALLOWED_COOKIE_NAME, allowed);

      // CSRF Token passed as cookie
      cookieForUI(
        request,
        reply,
        CSRF_TOKEN_COOKIE_NAME,
        await reply.generateCsrf()
      );

      reply.redirect("/");
    });
  };

  // a test user that is in charge of a few datasets
  addTestUserRoute(
    "/login-bypass-1",
    TEST_SUBJECT_1,
    TEST_SUBJECT_1_DISPLAY,
    TEST_SUBJECT_1_EMAIL
  );
  // a test user that is a Manager in some releases
  addTestUserRoute(
    "/login-bypass-2",
    TEST_SUBJECT_2,
    TEST_SUBJECT_2_DISPLAY,
    TEST_SUBJECT_2_EMAIL
  );
  // a test user that is a super admin equivalent
  addTestUserRoute(
    "/login-bypass-3",
    TEST_SUBJECT_3,
    TEST_SUBJECT_3_DISPLAY,
    TEST_SUBJECT_3_EMAIL
  );
}
