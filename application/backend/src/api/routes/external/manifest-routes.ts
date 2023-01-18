import { FastifyInstance } from "fastify";
import { DependencyContainer } from "tsyringe";
import { ReleaseService } from "../../../business/services/release-service";
import { ManifestType } from "../../../business/services/_release-manifest-helper";

export const manifestRoutes = async (
  fastify: FastifyInstance,
  opts: {
    container: DependencyContainer;
  }
) => {
  const releaseService = opts.container.resolve(ReleaseService);

  // TODO note that we have not yet established a auth layer and so are unclear in what user
  //      context this work is happening
  // TODO need clarity on what release id is used here - the EdgeDb one or the release identifier?
  fastify.get<{ Params: { releaseId: string }; Reply: ManifestType }>(
    "/manifest/:releaseId",
    {},
    async function (request, reply) {
      const releaseId = request.params.releaseId;

      console.log(releaseId);

      const manifest = await releaseService.getActiveManifest(releaseId);

      // whether it be lack of permissions, or bad release id, or non active release - we return 404 Not Found
      // if we have nothing correct to send
      if (!manifest) reply.status(404).send();
      else reply.send(manifest);
    }
  );
};
