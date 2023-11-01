import { FastifyInstance } from "fastify";
import {
  CreateFastifyContextOptions,
  fastifyTRPCPlugin,
} from "@trpc/server/adapters/fastify";
import { appRouter } from "../app-router";
import { Context } from "./routes/trpc-bootstrap";
import { TRPCError } from "@trpc/server";

/**
 * Define the Fastify setup for TRPC - the TRPC middleware, routes etc is
 * further defined in the appRouter definition.
 *
 * @param fastify
 * @param opts
 */
export const trpcRoutes = async (
  fastify: FastifyInstance,
  opts: {
    // we need a minimum context that at least provides us with a DI container
    trpcCreateContext: (opts: CreateFastifyContextOptions) => Promise<Context>;
  },
) => {
  // the CSRF plugin types seem to not be compatible with fastify (types!) any more
  // as a hack just changed to any
  // will probably we good next update to CSRF plugin so can then remove any
  fastify.addHook("preHandler", fastify.csrfProtection as any);

  await fastify.register(fastifyTRPCPlugin, {
    trpcOptions: {
      router: appRouter,
      createContext: opts.trpcCreateContext,
      onError: (opts: { error: TRPCError }) => {
        fastify.log.error(opts.error.cause);
      },
    },
  });
};
