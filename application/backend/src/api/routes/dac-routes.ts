import { FastifyInstance } from "fastify";
import { RemsApprovedApplicationType } from "@umccr/elsa-types";
import { authenticatedRouteOnEntryHelper } from "../api-routes";
import { DependencyContainer } from "tsyringe";
import { RemsService } from "../../business/services/rems-service";

// TODO: FIX ALL OF THIS - NEEDS THINKING ABOUT FROM MORE THAN JUST A REMS DAC
// TODO: FIX ALL OF THE SECURITY HERE - NEEDS AUTH / ROLES (WHO CAN DO THIS?)

export const dacRoutes = async (
  fastify: FastifyInstance,
  opts: { container: DependencyContainer },
) => {
  const remsService = opts.container.resolve(RemsService);

  // TODO: think about these route names etc.. just hacking them in wherever at the moment

  fastify.get<{
    Reply: RemsApprovedApplicationType[];
  }>("/api/dac/rems/new", {}, async function (request, reply) {
    const { authenticatedUser } = authenticatedRouteOnEntryHelper(request);

    const n = await remsService.detectNewReleases();

    reply.send(n);
  });

  fastify.post<{
    Params: { nid: string };
    Reply: any;
  }>("/api/dac/rems/new/:nid", {}, async function (request, reply) {
    const { authenticatedUser } = authenticatedRouteOnEntryHelper(request);

    await remsService.startNewRelease(
      authenticatedUser,
      parseInt(request.params.nid),
    );

    reply.send({});
  });
};
