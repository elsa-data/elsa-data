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

const isCookieSessionAuthed = t.middleware(({ next, ctx }) => {
  const userService = ctx.container.resolve(UsersService);

  let sessionDbObject: SingleUserBySubjectIdType = ctx.req.session.get(
    SESSION_USER_DB_OBJECT
  );

  if (!sessionDbObject) {
    ctx.req.log.error(
      "isCookieSessionAuthed: no session cookie data present so failing authentication"
    );

    throw new TRPCError({
      code: "UNAUTHORIZED",
    });
  }

  const authedUser = new AuthenticatedUser(sessionDbObject);

  ctx.req.log.trace(authedUser, `isCookieSessionAuthed: user details`);

  return next({
    ctx: {
      user: authedUser,
      ...ctx,
    },
  });
});

export const publicProcedure = t.procedure;

export const internalProcedure = t.procedure.use(isCookieSessionAuthed);
