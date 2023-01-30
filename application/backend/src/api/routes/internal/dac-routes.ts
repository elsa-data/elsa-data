import { FastifyInstance } from "fastify";
import {
  AustraliaGenomicsDacRedcap,
  RemsApprovedApplicationType,
} from "@umccr/elsa-types";
import { authenticatedRouteOnEntryHelper } from "../../api-internal-routes";
import { DependencyContainer } from "tsyringe";
import { RemsService } from "../../../business/services/rems-service";
import { RedcapImportApplicationService } from "../../../business/services/australian-genomics/redcap-import-application-service";

// TODO: FIX ALL OF THE SECURITY HERE - NEEDS DECISIONS ON AUTH / ROLES (WHO CAN DO THIS?)

export const dacRoutes = async (
  fastify: FastifyInstance,
  opts: { container: DependencyContainer }
) => {
  const remsService = opts.container.resolve(RemsService);
  const redcapAgService = opts.container.resolve(
    RedcapImportApplicationService
  );

  // TODO: think about these route names etc.. just hacking them in wherever at the moment

  fastify.get<{
    Reply: RemsApprovedApplicationType[];
  }>("/dac/rems/new", {}, async function (request, reply) {
    const { authenticatedUser } = authenticatedRouteOnEntryHelper(request);

    const n = await remsService.detectNewReleases();

    reply.send(n);
  });

  fastify.post<{
    Params: { nid: string };
    Reply: string;
  }>("/dac/rems/new/:nid", {}, async function (request, reply) {
    const { authenticatedUser } = authenticatedRouteOnEntryHelper(request);

    const newReleaseId = await remsService.startNewRelease(
      authenticatedUser,
      parseInt(request.params.nid)
    );

    reply.send(newReleaseId);
  });

  fastify.post<{
    Body: AustraliaGenomicsDacRedcap[];
    Reply: AustraliaGenomicsDacRedcap[];
  }>("/dac/redcap/possible", {}, async function (request, reply) {
    const { authenticatedUser } = authenticatedRouteOnEntryHelper(request);

    const n = await redcapAgService.detectNewReleases(request.body);

    reply.send(n);
  });

  fastify.post<{
    Body: AustraliaGenomicsDacRedcap;
    Reply: string;
  }>("/dac/redcap/new", {}, async function (request, reply) {
    const { authenticatedUser } = authenticatedRouteOnEntryHelper(request);

    const newReleaseId = await redcapAgService.startNewRelease(
      authenticatedUser,
      request.body
    );

    reply.send(newReleaseId);
  });
};
