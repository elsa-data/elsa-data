import { FastifyInstance } from "fastify";
import { DependencyContainer } from "tsyringe";
import { ManifestService } from "../../../business/services/manifests/manifest-service";
import { ManifestType } from "../../../business/services/manifests/manifest-types";

export const manifestRoutes = async (
  fastify: FastifyInstance,
  opts: {
    container: DependencyContainer;
  }
) => {
  const manifestService = opts.container.resolve(ManifestService);

  // TODO note that we have not yet established a auth layer and so are unclear in what user
  //      context this work is happening
  // TODO need clarity on what release id is used here - the EdgeDb one or the release identifier?
  fastify.get<{ Params: { releaseKey: string }; Reply: ManifestType }>(
    "/manifest/:releaseKey",
    {},
    async function (request, reply) {
      const releaseKey = request.params.releaseKey;

      console.log(releaseKey);

      const manifest = await manifestService.getActiveManifest(releaseKey);

      // whether it be lack of permissions, or bad release id, or non active release - we return 404 Not Found
      // if we have nothing correct to send
      if (!manifest) reply.status(404).send();
      else reply.send(manifest);
    }
  );
};
