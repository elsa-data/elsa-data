import { FastifyInstance } from "fastify";
import {
  CreateFastifyContextOptions,
  fastifyTRPCPlugin,
} from "@trpc/server/adapters/fastify";
import { appRouter } from "../app-router";
import { Context } from "./routes/trpc-bootstrap";

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
  }
) => {
  fastify.addHook("preHandler", fastify.csrfProtection);

  await fastify.register(fastifyTRPCPlugin, {
    trpcOptions: {
      router: appRouter,
      createContext: opts.trpcCreateContext,
    },
  });
};
