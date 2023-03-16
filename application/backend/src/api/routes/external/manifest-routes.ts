import { FastifyInstance } from "fastify";
import { DependencyContainer } from "tsyringe";
import { ManifestService } from "../../../business/services/manifests/manifest-service";
import { ManifestHtsgetType } from "../../../business/services/manifests/manifest-htsget-types";

export const manifestRoutes = async (
  fastify: FastifyInstance,
  opts: {
    container: DependencyContainer;
  }
) => {
  const manifestService = opts.container.resolve(ManifestService);

  // TODO note that we have not yet established a auth layer and so are unclear in what user
  //      context this work is happening
  fastify.get<{ Params: { releaseKey: string }; Reply: ManifestHtsgetType }>(
    "/manifest/:releaseKey",
    {},
    async function (request, reply) {
      const releaseKey = request.params.releaseKey;

      const manifest = await manifestService.getActiveHtsgetManifest(
        releaseKey
      );

      // whether it be lack of permissions, or bad release id, or non active release - we return 404 Not Found
      // if we have nothing correct to send
      if (!manifest) reply.status(404).send();
      else reply.send(manifest);
    }
  );
};
