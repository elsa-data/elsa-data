import { inferAsyncReturnType } from "@trpc/server";
import { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import { container } from "tsyringe";
import { UsersService } from "../../business/services/users-service";
import { ReleaseService } from "../../business/services/release-service";
import { getServices } from "../../di-helpers";
import { JobsService } from "../../business/services/jobs/jobs-base-service";
import { AwsAccessPointService } from "../../business/services/aws-access-point-service";
import { ReleaseParticipationService } from "../../business/services/release-participation-service";

export const createContext = async (opts: CreateFastifyContextOptions) => {
  const { edgeDbClient, settings, logger } = getServices(container);
  return {
    container,
    edgeDbClient,
    settings,
    logger,
    userService: container.resolve(UsersService),
    releaseService: container.resolve(ReleaseService),
    releaseParticipantService: container.resolve(ReleaseParticipationService),
    jobService: container.resolve(JobsService),
    awsAccessPointService: container.resolve(AwsAccessPointService),

    req: opts.req,
    res: opts.res,
  };
};

export type Context = inferAsyncReturnType<typeof createContext>;
