import { FastifyInstance } from "fastify";
import { DependencyContainer } from "tsyringe";
import { UsersService } from "../../../business/services/users-service";
import { getServices } from "../../../di-helpers";

export const manifestRoutes = async (
  fastify: FastifyInstance,
  opts: {
    container: DependencyContainer;
  }
) => {
  const userService = opts.container.resolve(UsersService);
  const { settings } = getServices(opts.container);

  fastify.get<{ Reply: any }>("/manifest", {}, async function (request, reply) {
    console.log("manifest");

    reply.send({});
  });
};
