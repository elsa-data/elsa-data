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
import { AGService } from "../../business/services/australian-genomics/s3-index-import-service";
import {
  authenticatedRouteOnEntryHelper,
  sendPagedResult,
} from "../api-routes";
import { ElsaSettings } from "../../config/elsa-settings";

export const datasetRoutes = async (fastify: FastifyInstance) => {
  const datasetsService = container.resolve(DatasetService);
  const agService = container.resolve(AGService);

  /**
   * Pageable fetching of top-level dataset information (summary level info)
   */
  fastify.get<{ Reply: DatasetLightType[] }>(
    "/api/datasets/all",
    {},
    async function (request, reply) {
      const { authenticatedUser, pageSize, offset } =
        authenticatedRouteOnEntryHelper(request);

      const datasetsPagedResult = await datasetsService.getAll(
        authenticatedUser,
        pageSize,
        offset
      );

      sendPagedResult(reply, datasetsPagedResult);
    }
  );

  fastify.get<{ Reply: DatasetLightType[] }>(
    "/api/datasets/available",
    {},
    async function (request, reply) {
      const { authenticatedUser, pageSize, offset } =
        authenticatedRouteOnEntryHelper(request);

      const datasetsPagedResult = await datasetsService.getOnlyAvailableDataset(
        authenticatedUser,
        pageSize,
        offset
      );

      sendPagedResult(reply, datasetsPagedResult);
    }
  );

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
};
