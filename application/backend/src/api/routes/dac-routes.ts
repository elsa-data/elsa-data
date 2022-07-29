import { FastifyInstance } from "fastify";
import { RemsApprovedApplicationType } from "@umccr/elsa-types";
import { authenticatedRouteOnEntryHelper } from "../api-routes";
import { container } from "tsyringe";
import { RemsService } from "../../business/services/rems-service";

export const dacRoutes = async (fastify: FastifyInstance, opts: any) => {
  const remsService = container.resolve(RemsService);

  fastify.get<{
    Params: { rid: string };
    Reply: RemsApprovedApplicationType[];
  }>("/api/dac/rems/new", {}, async function (request, reply) {
    const { authenticatedUser } = authenticatedRouteOnEntryHelper(request);

    const n = await remsService.detectNewReleases();

    reply.send(n);
  });
};
