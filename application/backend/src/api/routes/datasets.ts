import { FastifyInstance } from "fastify";
import {
  DatasetDeepType,
  DatasetGen3SyncRequestType,
  DatasetGen3SyncResponseType,
  DatasetLightType,
} from "@umccr/elsa-types";
import { ElsaSettings } from "../../bootstrap-settings";
import { datasetGen3SyncRequestValidate } from "../../validators/validate-json";
import { datasetsService } from "../../business/services/datasets";
import { currentPageSize } from "../api-pagination";

export const datasetRoutes = async (fastify: FastifyInstance, opts: any) => {
  /**
   * Pageable fetching of top-level dataset information (summary level info)
   */
  fastify.get<{ Reply: DatasetLightType[] }>(
    "/api/datasets",
    {},
    async function (request, reply) {
      const limit = currentPageSize(request);

      const offset = (request.query as any).offset || 0;

      const converted = await datasetsService.getAll(
        { subjectId: "ss" },
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
      const elsaSettings: ElsaSettings = (request as any).settings;

      const datasetId = request.params.did;

      const result = await datasetsService.get({ subjectId: "aa" }, datasetId);

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
