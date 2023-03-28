import { initTRPC, TRPCError } from "@trpc/server";
import { Context } from "./trpc-context";
import { getAuthenticatedUserFromSecureSession } from "../auth/session-cookie-helpers";
import { createUserAllowedCookie } from "../helpers/cookie-helpers";

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const middleware = t.middleware;

/**
 * Middleware the requires there be a secure session cookie for the logged in user.
 */
const isSessionCookieAuthed = t.middleware(async ({ next, ctx }) => {
  const authedUser = getAuthenticatedUserFromSecureSession(ctx.req);
  if (!authedUser) {
    ctx.req.log.error(
      "isSessionCookieAuthed: no session cookie data was present so failing authentication"
    );

    throw new TRPCError({
      code: "UNAUTHORIZED",
    });
  }
  ctx.req.log.trace(authedUser, `isCookieSessionAuthed: user details`);

  // Checking cookie with Db
  const dbUser = await ctx.userService.getBySubjectId(authedUser.subjectId);
  if (!dbUser) {
    ctx.req.log.error(
      "isDbAuthed: no user data was present in database so failing authentication"
    );
    throw new TRPCError({
      code: "UNAUTHORIZED",
    });
  }

  // Checking cookie permissions
  const dbPermission = createUserAllowedCookie(dbUser);
  const sessionPermission = createUserAllowedCookie(authedUser);
  if (dbPermission != sessionPermission) {
    ctx.req.log.error(
      "isCookieDataUpdated: cookie permissions do not match with Db so failing authentication"
    );
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "User permissions have changed, please try logging back in!",
    });
  }

  return next({
    ctx: {
      user: authedUser,
      ...ctx,
    },
  });
});

export const publicProcedure = t.procedure;

export const internalProcedure = t.procedure.use(isSessionCookieAuthed);
