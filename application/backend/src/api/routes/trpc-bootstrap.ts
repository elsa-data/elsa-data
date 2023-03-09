import { initTRPC, TRPCError } from "@trpc/server";
import { Context } from "./trpc-context";
import { SingleUserBySubjectIdType } from "../../business/db/user-queries";
import {
  SESSION_TOKEN_PRIMARY,
  SESSION_USER_DB_OBJECT,
} from "../session-cookie-constants";
import { AuthenticatedUser } from "../../business/authenticated-user";
import { UsersService } from "../../business/services/users-service";

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const middleware = t.middleware;

const isAuthed = t.middleware(({ next, ctx }) => {
  const userService = ctx.container.resolve(UsersService);

  let sessionDbObject: SingleUserBySubjectIdType = ctx.req.session.get(
    SESSION_USER_DB_OBJECT
  );

  // TODO: consider do we really need this check? This is really a bearer token *out* into the passport/visa
  // and that's not what we are checking in this hook
  const sessionTokenPrimary = ctx.req.session.get(SESSION_TOKEN_PRIMARY);

  if (!sessionTokenPrimary || !sessionDbObject) {
    ctx.req.log.error(
      "createSessionCookieRouteHook: no session cookie data present so failing authentication"
    );

    throw new TRPCError({
      code: "UNAUTHORIZED",
    });
  }

  const authedUser = new AuthenticatedUser(sessionDbObject);

  ctx.req.log.trace(authedUser, `createSessionCookieRouteHook: user details`);

  return next({
    ctx: {
      user: authedUser,
      ...ctx,
    },
  });
});

export const publicProcedure = t.procedure;

export const internalProcedure = t.procedure.use(isAuthed);
