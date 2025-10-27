import type { FastifyInstance } from "fastify";
import type { DependencyContainer } from "tsyringe";
import { ManifestHtsgetStorageNotEnabled } from "../../../business/exceptions/manifest-htsget";
import { ManifestHtsgetService } from "../../../business/services/manifests/htsget/manifest-htsget-service";
import {
  ManifestHtsgetParamsSchema,
  type ManifestHtsgetParamsType,
  ManifestHtsgetQuerySchema,
  type ManifestHtsgetQueryType,
  ManifestHtsgetResponseSchema,
  type ManifestHtsgetResponseType,
} from "../../../business/services/manifests/htsget/manifest-htsget-types";
import { HtsgetAwsVpcLatticeAccessPointService } from "../../../business/services/sharers/htsget-aws-vpc-lattice-access-point/htsget-aws-vpc-lattice-access-point-service";

export const manifestRoutes = async (
  fastify: FastifyInstance,
  opts: {
    container: DependencyContainer;
  },
) => {
  const htsgetAwsVpcLatticeAccessPointService = opts.container.resolve(
    HtsgetAwsVpcLatticeAccessPointService,
  );

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
        request.query.type,
      );

      const output = await manifestService.publishHtsgetManifest(releaseKey);

      reply
        .header(
          "Cache-Control",
          `public, max-age=${output.maxAge}, must-revalidate, immutable`,
        )
        .send(output);
    },
  );

  /**
   * This is an integration with htsget-rs that sets up Elsa as a source of authorisation information
   * and sample mapping.
   */
  fastify.get("/integration/htsget-rs", {}, async function (request, reply) {
    if ("htsget-context-id" in request.headers) {
      const htsgetId = request.headers["htsget-context-id"];

      if (typeof htsgetId === "string") {
        const parts = htsgetId.split("/");

        // the first part of the id we take to be a Release Key - whether there are slashes or not...
        if (parts.length > 0) {
          // TODO: check the active sharers for this and check the auth VPC ids

          const d =
            await htsgetAwsVpcLatticeAccessPointService.getInstalledHtsgetAwsVpcLatticeAccessPoint(
              parts[0],
            );

          if (d) {
            const auth =
              await htsgetAwsVpcLatticeAccessPointService.getHtsgetVpcLatticeAccessPointAuthorisation(
                d,
                parts[0],
              );

            reply
              //.header(
              //  "Cache-Control",
              //  `public, max-age=${output.maxAge}, must-revalidate, immutable`,
              // )
              .send(auth);

            return;
          }
        }
      }
    }

    reply.send({
      error: `No authorisation information - possibly reasons can be mismatched release ids, inactivated access points etc`,
    });
  });
};
