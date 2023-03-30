import { FastifyInstance } from "fastify";
import { fastifyTRPCPlugin } from "@trpc/server/adapters/fastify";
import { appRouter } from "../app-router";
import { createContext } from "./routes/trpc-context";

/**
 * Defined for trpc routes
 *
 * @param fastify
 */
export const trpcRoutes = async (fastify: FastifyInstance) => {
  fastify.addHook("preHandler", fastify.csrfProtection);

  fastify.register(fastifyTRPCPlugin, {
    trpcOptions: { router: appRouter, createContext },
  });
};
