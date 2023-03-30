import { FastifyInstance } from "fastify";
import { DependencyContainer } from "tsyringe";
import { ManifestService } from "../../../business/services/manifests/manifest-service";
import {
  ManifestHtsgetParamsSchema,
  ManifestHtsgetParamsType,
  ManifestHtsgetQuerySchema,
  ManifestHtsgetQueryType,
  ManifestHtsgetResponseSchema,
  ManifestHtsgetResponseType,
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
    Params: ManifestHtsgetParamsType;
    Reply: ManifestHtsgetResponseType;
    Querystring: ManifestHtsgetQueryType;
  }>(
    "/manifest/htsget/:releaseKey",
    {
      schema: {
        params: ManifestHtsgetParamsSchema,
        response: {
          "2xx": ManifestHtsgetResponseSchema,
        },
        querystring: ManifestHtsgetQuerySchema,
      },
    },
    async function (request, reply) {
      const releaseKey = request.params.releaseKey;

      const output = await manifestService.publishHtsgetManifest(
        request.query.type,
        releaseKey
      );
      reply.send(output);
    }
  );
};
