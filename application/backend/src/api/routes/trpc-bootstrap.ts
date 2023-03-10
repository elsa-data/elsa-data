import { initTRPC, TRPCError } from "@trpc/server";
import { Context } from "./trpc-context";
import { getAuthenticatedUserFromSecureSession } from "../auth/session-cookie-helpers";

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const middleware = t.middleware;

/**
 * Middleware the requires there be a secure session cookie for the logged in user.
 */
const isSessionCookieAuthed = t.middleware(({ next, ctx }) => {
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

  return next({
    ctx: {
      user: authedUser,
      ...ctx,
    },
  });
});

export const publicProcedure = t.procedure;

export const internalProcedure = t.procedure.use(isSessionCookieAuthed);
