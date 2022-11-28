import { FastifyInstance } from "fastify";
import {
  DatasetDeepType,
  DatasetGen3SyncRequestType,
  DatasetGen3SyncResponseType,
  DatasetLightType,
} from "@umccr/elsa-types";
import { datasetGen3SyncRequestValidate } from "../../validators/validate-json";
import { container } from "tsyringe";
import { DatasetService } from "../../business/services/dataset-service";
import { S3IndexApplicationService } from "../../business/services/australian-genomics/s3-index-import-service";
import {
  authenticatedRouteOnEntryHelper,
  sendPagedResult,
} from "../api-routes";
import { Static, Type } from "@sinclair/typebox";
import { ElsaSettings } from "../../config/elsa-settings";

export const DatasetSummaryQuerySchema = Type.Object({
  includeDeletedFile: Type.Optional(Type.String()),
});
export type DatasetSummaryQueryType = Static<typeof DatasetSummaryQuerySchema>;

export const datasetRoutes = async (fastify: FastifyInstance) => {
  const datasetsService = container.resolve(DatasetService);
  const agService = container.resolve(S3IndexApplicationService);

  /**
   * Pageable fetching of top-level dataset information (summary level info)
   */
  fastify.get<{
    Querystring: DatasetSummaryQueryType;
    Reply: DatasetLightType[];
  }>("/api/datasets/", {}, async function (request, reply) {
    const { authenticatedUser, pageSize, offset } =
      authenticatedRouteOnEntryHelper(request);

    const { includeDeletedFile = "false" } = request.query;
    const datasetsPagedResult = await datasetsService.getSummary(
      authenticatedUser,
      pageSize,
      offset,
      includeDeletedFile === "true" ? true : false
    );

    sendPagedResult(reply, datasetsPagedResult);
  });

  fastify.get<{ Params: { did: string }; Reply: DatasetDeepType }>(
    "/api/datasets/:did",
    {},
    async function (request, reply) {
      const { authenticatedUser } = authenticatedRouteOnEntryHelper(request);

      const elsaSettings: ElsaSettings = (request as any).settings;

      const datasetId = request.params.did;

      const result = await datasetsService.get(authenticatedUser, datasetId);

      if (result) reply.send(result);
      else reply.status(403).send();
    }
  );

  fastify.post<{
    Request: DatasetGen3SyncRequestType;
    Reply: DatasetGen3SyncResponseType;
  }>("/api/datasets", {}, async function (request, reply) {
    if (!datasetGen3SyncRequestValidate(request.body)) {
      //reply
      //    .code(200)
      //    .header('Content-Type', 'application/json; charset=utf-8')
      //    .send({ hello: 'world' })

      reply.send({
        error: datasetGen3SyncRequestValidate.errors?.join(" "),
      });
    }

    reply.send({
      error: undefined,
    });
  });

  fastify.post<{ Body: { keyPrefix: string } }>(
    "/api/datasets/ag/import",
    {},
    async function (request, reply) {
      const body = request.body;
      const keyPrefix = body.keyPrefix;

      agService.syncDbFromS3KeyPrefix(keyPrefix);
      reply.send(
        "OK! \nTo prevent API timeout, returning the OK value while the script is still running. "
      );
    }
  );

  fastify.post<{ Body: { datasetId: string } }>(
    "/api/datasets/sync",
    {},
    async function (request, reply) {
      const body = request.body;
      const datasetId = body.datasetId;
      // TODO: Make dataset service support re-sync or import
      console.log(`datasetId received:`, datasetId);

      reply.send(
        "OK! \nTo prevent API timeout, returning the OK while importing might still run in the background. "
      );
    }
  );
};
