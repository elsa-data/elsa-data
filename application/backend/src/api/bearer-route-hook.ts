import { FastifyReply, FastifyRequest } from "fastify";
import { UserService } from "../business/services/user-service";

export function createBearerRouteHook(userService: UserService) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Should these be completely unauthorised?
      // TBD decide on what authorization content we actually want
      // if (!request.headers["authorization"]) {
      //   return reply.code(401).send();
      // }
      // fall through to executing the rest of the route
    } catch (error) {
      request.log.error(error, "createBearerRouteHook: overall error");

      // we are interpreting an exception here as an authentication failure 401
      reply.code(401).send();
    }
  };
}
