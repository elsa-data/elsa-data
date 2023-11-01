import { FastifyInstance } from "fastify";
import {
  ReleasePresignRequestSchema,
  ReleasePresignRequestType,
} from "@umccr/elsa-types";
import { authenticatedRouteOnEntryHelper } from "../../api-internal-routes";
import { DependencyContainer } from "tsyringe";
import { ReleaseService } from "../../../business/services/releases/release-service";
import { AwsAccessPointService } from "../../../business/services/sharers/aws-access-point/aws-access-point-service";
import { PresignedUrlService } from "../../../business/services/presigned-url-service";
import { ManifestService } from "../../../business/services/manifests/manifest-service";
import { S3ManifestHtsgetService } from "../../../business/services/manifests/htsget/manifest-htsget-service";

/**
 * We want to allow manifests to be downloaded with kind of native browser
 * downloads. To do this - we use a HTML form with POST action that
 * returns a piped "Content" result.
 *
 * All the routes that act like this are here.
 *
 * @param fastify
 * @param _opts
 */
export const manifestDownloadRoutes = async (
  fastify: FastifyInstance,
  _opts: { container: DependencyContainer },
) => {
  const presignedUrlService = _opts.container.resolve(PresignedUrlService);
  const awsAccessPointService = _opts.container.resolve(AwsAccessPointService);
  const htsgetService = _opts.container.resolve(S3ManifestHtsgetService);
  const releaseService = _opts.container.resolve(ReleaseService);
  const manifestService = _opts.container.resolve(ManifestService);

  // this TSV manifest is available to everyone involved in the project
  // it does not contain anything that provides access to actual genomic or phenotypic data
  fastify.post<{
    Body?: ReleasePresignRequestType;
    Params: { rid: string };
  }>(
    "/releases/:rid/tsv-manifest-plaintext",
    {},
    async function (request, reply) {
      const { authenticatedUser } = authenticatedRouteOnEntryHelper(request);

      const presignHeader = request.body?.presignHeader ?? [];
      const presignHeaderArray = Array.isArray(presignHeader)
        ? presignHeader
        : [presignHeader];

      if (presignHeader.includes("objectStoreSigned")) {
        // This would ideally be checked with an appropriate type for the request
        // `Body`. But that'd involve defining a separate type almost identical
        // to `ReleasePresignRequestType`, which is too repetitious for my taste.
        reply.status(400).send();
        return;
      }

      const releaseKey = request.params.rid;

      const manifest = await manifestService.getActiveTsvManifestAsString(
        presignedUrlService,
        authenticatedUser,
        releaseKey,
        presignHeaderArray,
      );

      if (!manifest) {
        reply.status(404).send();
        return;
      }

      reply
        .status(200)
        .header(
          "Content-Disposition",
          `attachment; filename=manifest-${releaseKey}.tsv`,
        )
        .header("Content-Type", "text/tab-separated-values")
        .send(manifest);
    },
  );

  // this TSV manifest also contains the object data as shared via AWS access points
  // because the security is baked into the access point itself - this can be downloaded as plain text
  // (the included URL links are useless except in the accounts/vpc where the data is shared to)
  fastify.post<{
    Body: ReleasePresignRequestType;
    Params: { rid: string };
  }>(
    "/releases/:rid/tsv-manifest-aws-access-point",
    {
      schema: {
        body: ReleasePresignRequestSchema,
      },
    },
    async function (request, reply) {
      const { authenticatedUser } = authenticatedRouteOnEntryHelper(request);

      const releaseKey = request.params.rid;
      const presignHeaderArray = Array.isArray(request.body.presignHeader)
        ? request.body.presignHeader
        : [request.body.presignHeader];

      const accessPointTsv =
        await awsAccessPointService.getAccessPointBucketKeyManifest(
          authenticatedUser,
          releaseKey,
          presignHeaderArray,
        );

      reply.header(
        "Content-disposition",
        `attachment; filename=${accessPointTsv.filename}`,
      );
      reply.type("text/tab-separated-values");
      reply.send(accessPointTsv.content);
    },
  );

  // this TSV manifest contains object represented at a particular htsget endpoint
  // because the security is baked into the htsget protocol - this can be downloaded as plain text
  // (users still would need to auth to the htsget endpoint before getting the data)
  fastify.post<{
    Body: ReleasePresignRequestType;
    Params: { rid: string };
  }>(
    "/releases/:rid/tsv-manifest-htsget",
    {
      schema: {
        body: ReleasePresignRequestSchema,
      },
    },
    async function (request, reply) {
      const { authenticatedUser } = authenticatedRouteOnEntryHelper(request);

      const releaseKey = request.params.rid;
      const presignHeaderArray = Array.isArray(request.body.presignHeader)
        ? request.body.presignHeader
        : [request.body.presignHeader];

      const htsgetTsv = await htsgetService.getActiveHtsgetManifestAsTsv(
        authenticatedUser,
        releaseKey,
        presignHeaderArray,
      );

      reply.header(
        "Content-disposition",
        `attachment; filename=${htsgetTsv.filename}`,
      );
      reply.type("text/tab-separated-values");
      reply.send(htsgetTsv.content);
    },
  );

  // this TSV manifest contains signed URLS that give access to the genomic data for up to 7 days
  // because possession of this file is the same as possessing the data - we encrypt the TSV into
  // a password protected zip (which ensures that the basic download left in a Downloads folder
  // on a laptop won't accidentally provide access to the data)
  fastify.post<{
    Body?: ReleasePresignRequestType;
    Params: { rid: string };
  }>(
    "/releases/:rid/tsv-manifest-archive",
    {},
    async function (request, reply) {
      const { authenticatedUser } = authenticatedRouteOnEntryHelper(request);

      const presignHeader = request.body?.presignHeader ?? [];
      const presignHeaderArray = Array.isArray(presignHeader)
        ? presignHeader
        : [presignHeader];

      const releaseKey = request.params.rid;

      const manifest = await manifestService.getActiveTsvManifestAsArchive(
        presignedUrlService,
        authenticatedUser,
        releaseKey,
        presignHeaderArray,
      );

      if (!manifest) {
        reply.status(404).send();
        return;
      }

      reply.raw.writeHead(200, {
        "Content-Disposition": `attachment; filename=manifest-${releaseKey}.zip`,
        "Content-Type": "application/octet-stream",
      });

      manifest.pipe(reply.raw);
    },
  );
};
