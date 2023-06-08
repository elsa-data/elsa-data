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
} from "../test-data/user/insert-user1";
import {
  TEST_SUBJECT_2,
  TEST_SUBJECT_2_DISPLAY,
  TEST_SUBJECT_2_EMAIL,
} from "../test-data/user/insert-user2";
import {
  TEST_SUBJECT_3,
  TEST_SUBJECT_3_DISPLAY,
  TEST_SUBJECT_3_EMAIL,
} from "../test-data/user/insert-user3";
import {
  TEST_SUBJECT_4,
  TEST_SUBJECT_4_DISPLAY,
  TEST_SUBJECT_4_EMAIL,
} from "../test-data/user/insert-user4";
import {
  cookieForBackend,
  cookieForUI,
  createUserAllowedCookie,
} from "./helpers/cookie-helpers";
import { getServices } from "../di-helpers";

const ALL_TEST_SUBJECT = [
  {
    subject_id: TEST_SUBJECT_1,
    name: TEST_SUBJECT_1_DISPLAY,
    email: TEST_SUBJECT_1_EMAIL,
    bypassPath: "/login-bypass-1",
  },
  {
    subject_id: TEST_SUBJECT_2,
    name: TEST_SUBJECT_2_DISPLAY,
    email: TEST_SUBJECT_2_EMAIL,
    bypassPath: "/login-bypass-2",
  },
  {
    subject_id: TEST_SUBJECT_3,
    name: TEST_SUBJECT_3_DISPLAY,
    email: TEST_SUBJECT_3_EMAIL,
    bypassPath: "/login-bypass-3",
  },
  {
    subject_id: TEST_SUBJECT_4,
    name: TEST_SUBJECT_4_DISPLAY,
    email: TEST_SUBJECT_4_EMAIL,
    bypassPath: "/login-bypass-4",
  },
];

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
    container: DependencyContainer;
  }
) {
  const { logger } = getServices(opts.container);

  const userService = opts.container.resolve(UserService);

  for (const subjectProp of ALL_TEST_SUBJECT) {
    const subject = await userService.upsertUserForLogin(
      subjectProp.subject_id,
      subjectProp.name,
      subjectProp.email
    );

    if (!subject)
      throw new Error(
        "Test users not setup correctly in database even though they are meant to be enabled"
      );

    addTestUserRoute(
      fastify,
      opts.container,
      subjectProp.bypassPath,
      subjectProp.subject_id,
      subjectProp.name,
      subjectProp.email
    );
  }
}

/**
 * Helper Function
 */

// register a login endpoint that sets a cookie without actual login
// NOTE: this has to replicate all the real auth login steps (set the same cookies etc)
// MAKE SURE THIS IS KEPT IN SYNC WITH THE REAL AUTH LOGIN!!
const addTestUserRoute = (
  fastify: FastifyInstance,
  container: DependencyContainer,
  path: string,
  subjectId: string,
  name: string,
  email: string
) => {
  fastify.post(path, async (request, reply) => {
    const { logger } = getServices(container);
    const userService = container.resolve(UserService);

    const authUser = await userService.upsertUserForLogin(
      subjectId,
      name,
      email,
      {
        ip: "192.19.192.192", // An example of US IP location
      }
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
    cookieForBackend(request, reply, SESSION_USER_DB_OBJECT, authUser.asJson());

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
    cookieForUI(request, reply, CSRF_TOKEN_COOKIE_NAME, reply.generateCsrf());

    reply.redirect("/");
  });
};
