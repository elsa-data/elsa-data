import { FastifyInstance } from "fastify";
import { DependencyContainer } from "tsyringe";
import { ManifestService } from "../../../business/services/manifests/manifest-service";
import {
  ManifestHtsGetParamsSchema,
  ManifestHtsGetParamsType,
  ManifestHtsGetQuerySchema,
  ManifestHtsGetQueryType,
  ManifestHtsGetResponseSchema,
  ManifestHtsGetResponseType,
} from "../../../business/services/manifests/htsget/manifest-htsget-types";

export const manifestRoutes = async (
  fastify: FastifyInstance,
  opts: {
    container: DependencyContainer;
  }
) => {
  const manifestService = opts.container.resolve(ManifestService);

  // TODO note that we have not yet established a auth layer and so are unclear in what user
  //      context this work is happening
  fastify.get<{
    Params: ManifestHtsGetParamsType;
    Reply: ManifestHtsGetResponseType;
    Querystring: ManifestHtsGetQueryType;
  }>(
    "/manifest/htsget/:releaseKey",
    {
      schema: {
        params: ManifestHtsGetParamsSchema,
        response: ManifestHtsGetResponseSchema,
        querystring: ManifestHtsGetQuerySchema,
      },
    },
    async function (request, reply) {
      const releaseKey = request.params.releaseKey;

      const output = await manifestService.publishHtsGetManifest(
        request.query.type,
        releaseKey
      );
      reply.send(output);
    }
  );
};
