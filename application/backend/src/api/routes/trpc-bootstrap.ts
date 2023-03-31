import { initTRPC, TRPCError } from "@trpc/server";
import { getAuthenticatedUserFromSecureSession } from "../auth/session-cookie-helpers";
import { createUserAllowedCookie } from "../helpers/cookie-helpers";
import { DependencyContainer } from "tsyringe";
import { FastifyReply, FastifyRequest } from "fastify";
import { UsersService } from "../../business/services/users-service";
import { getServices } from "../../di-helpers";
import { ReleaseService } from "../../business/services/release-service";
import { ReleaseActivationService } from "../../business/services/release-activation-service";
import { ReleaseParticipationService } from "../../business/services/release-participation-service";
import { JobsService } from "../../business/services/jobs/jobs-base-service";
import { JobCloudFormationCreateService } from "../../business/services/jobs/job-cloud-formation-create-service";
import { JobCloudFormationDeleteService } from "../../business/services/jobs/job-cloud-formation-delete-service";
import { JobCopyOutService } from "../../business/services/jobs/job-copy-out-service";
import * as edgedb from "edgedb";
import { AwsAccessPointService } from "../../business/services/aws/aws-access-point-service";

/**
 * This is the types for the initial context that we guarantee exits for
 * every request. We extend this via our middleware.
 */
export type Context = {
  container: DependencyContainer;
  req?: FastifyRequest;
  res?: FastifyReply;
};

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const middleware = t.middleware;

/**
 * Middleware that requires there be a secure session cookie for the logged-in user.
 */
const isSessionCookieAuthed = middleware(async ({ next, ctx }) => {
  if (!ctx.req || !ctx.res) {
    throw new Error("You are missing `req` or `res` in your call.");
  }

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
  const dbUser = await ctx.container
    .resolve(UsersService)
    .getBySubjectId(authedUser.subjectId);
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

  const { edgeDbClient, settings, logger } = getServices(ctx.container);

  // now that we have authenticated we can inject the user globally into our db client
  ctx.container.register<edgedb.Client>("DatabaseWithUser", {
    useFactory: () =>
      edgeDbClient.withGlobals({
        user: authedUser.dbId,
      }),
  });

  return next({
    ctx: {
      user: authedUser,
      edgeDbClient,
      settings,
      logger,
      userService: ctx.container.resolve(UsersService),
      releaseService: ctx.container.resolve(ReleaseService),
      releaseActivationService: ctx.container.resolve(ReleaseActivationService),
      releaseParticipantService: ctx.container.resolve(
        ReleaseParticipationService
      ),
      jobService: ctx.container.resolve(JobsService),
      jobCloudFormationCreateService: ctx.container.resolve(
        JobCloudFormationCreateService
      ),
      jobCloudFormationDeleteService: ctx.container.resolve(
        JobCloudFormationDeleteService
      ),
      jobCopyOutService: ctx.container.resolve(JobCopyOutService),
      awsAccessPointService: ctx.container.resolve(AwsAccessPointService),
      req: ctx.req,
      res: ctx.res,
      ...ctx,
    },
  });
});

export const internalProcedure = t.procedure.use(isSessionCookieAuthed);
