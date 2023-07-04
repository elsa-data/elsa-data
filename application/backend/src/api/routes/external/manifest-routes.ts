import { FastifyInstance } from "fastify";
import { DependencyContainer } from "tsyringe";
import {
  ManifestHtsgetParamsSchema,
  ManifestHtsgetParamsType,
  ManifestHtsgetQuerySchema,
  ManifestHtsgetQueryType,
  ManifestHtsgetResponseSchema,
  ManifestHtsgetResponseType,
} from "../../../business/services/manifests/htsget/manifest-htsget-types";
import { ManifestHtsgetService } from "../../../business/services/manifests/htsget/manifest-htsget-service";
import { ManifestHtsgetStorageNotEnabled } from "../../../business/exceptions/manifest-htsget";

export const manifestRoutes = async (
  fastify: FastifyInstance,
  opts: {
    container: DependencyContainer;
  }
) => {
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
      if (request.query.type === "GCP" || request.query.type === "R2") {
        throw new ManifestHtsgetStorageNotEnabled();
      }

      const releaseKey = request.params.releaseKey;

      const manifestService = opts.container.resolve<ManifestHtsgetService>(
        request.query.type
      );

      const output = await manifestService.publishHtsgetManifest(releaseKey);

      reply
        .header(
          "Cache-Control",
          `public, max-age=${output.maxAge}, must-revalidate, immutable`
        )
        .send(output);
    }
  );
};
