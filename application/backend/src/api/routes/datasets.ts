import { FastifyInstance } from "fastify";
import {
  DatasetDeepType,
  DatasetGen3SyncRequestType,
  DatasetGen3SyncResponseType,
  DatasetLightType,
} from "@umccr/elsa-types";
import { ElsaSettings } from "../../bootstrap-settings";
import { datasetGen3SyncRequestValidate } from "../../validators/validate-json";
import { currentPageSize } from "../api-pagination";
import { container } from "tsyringe";
import { AwsBaseService } from "../../business/services/aws-base-service";
import { DatasetsService } from "../../business/services/datasets-service";
import { authenticatedRouteOnEntryHelper } from "../api-routes";

export const datasetRoutes = async (fastify: FastifyInstance, opts: any) => {
  const datasetsService = container.resolve(DatasetsService);

  /**
   * Pageable fetching of top-level dataset information (summary level info)
   */
  fastify.get<{ Reply: DatasetLightType[] }>(
    "/api/datasets",
    {},
    async function (request, reply) {
      const { authenticatedUser } = authenticatedRouteOnEntryHelper(request);

      const limit = currentPageSize(request);

      const offset = (request.query as any).offset || 0;

      const converted = await datasetsService.getAll(
        authenticatedUser,
        limit,
        offset
      );

      reply.send(converted);
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
};
