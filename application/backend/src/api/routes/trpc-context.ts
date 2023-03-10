import { inferAsyncReturnType } from "@trpc/server";
import { CreateFastifyContextOptions } from "@trpc/server/adapters/fastify";
import { container } from "tsyringe";
import { UsersService } from "../../business/services/users-service";
import { ReleaseService } from "../../business/services/release-service";
import { getServices } from "../../di-helpers";
import { ReleaseActivationService } from "../../business/services/release-activation-service";

export const createContext = async (opts: CreateFastifyContextOptions) => {
  const { edgeDbClient, settings, logger } = getServices(container);
  return {
    container,
    edgeDbClient,
    settings,
    logger,
    userService: container.resolve(UsersService),
    releaseService: container.resolve(ReleaseService),
    releaseActivationService: container.resolve(ReleaseActivationService),

    req: opts.req,
    res: opts.res,
  };
};

export type Context = inferAsyncReturnType<typeof createContext>;
