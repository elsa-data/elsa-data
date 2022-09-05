import { FastifyInstance } from "fastify";
import {
  authenticatedRouteOnEntryHelper,
  sendPagedResult,
} from "../api-routes";
import { container } from "tsyringe";
import { UsersService } from "../../business/services/users-service";
import { UserSummaryType } from "@umccr/elsa-types/schemas-users";
import { ElsaSettings } from "../../config/elsa-settings";
import { isSuperAdmin } from "../../auth/auth-route-hook";

export const userRoutes = async (fastify: FastifyInstance, opts: any) => {
  const userService = container.resolve(UsersService);
  const settings = container.resolve<ElsaSettings>("Settings");

  // const superAdminAuthHook = createSuperAdminAuthRouteHook(settings);
  //fastify.addHook("onRequest", superAdminAuthHook, () => {
  //
  //});

  fastify.get<{ Reply: UserSummaryType[] }>(
    "/api/users",
    {},
    async function (request, reply) {
      const { authenticatedUser, pageSize, page } =
        authenticatedRouteOnEntryHelper(request);

      // if (!isSuperAdmin(settings, authenticatedUser)) {
      //   reply.status(404);
      //   return;
      // }

      const users = await userService.getUsers(
        authenticatedUser,
        pageSize,
        (page - 1) * pageSize
      );

      console.log(users);

      sendPagedResult(reply, users, page, `/api/users?`);
    }
  );
};
