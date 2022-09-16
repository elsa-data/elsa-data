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
import { AGService } from "../../business/services/ag-service";
import {
  authenticatedRouteOnEntryHelper,
  sendPagedResult,
} from "../api-routes";
import { ElsaSettings } from "../../config/elsa-settings";

export const datasetRoutes = async (fastify: FastifyInstance, opts: any) => {
  const datasetsService = container.resolve(DatasetService);
  const agService = container.resolve(AGService);

  /**
   * Pageable fetching of top-level dataset information (summary level info)
   */
  fastify.get<{ Reply: DatasetLightType[] }>(
    "/api/datasets",
    {},
    async function (request, reply) {
      const { authenticatedUser, pageSize, page, offset } =
        authenticatedRouteOnEntryHelper(request);

      const datasetsPagedResult = await datasetsService.getAll(
        authenticatedUser,
        pageSize,
        offset
      );

      sendPagedResult(reply, datasetsPagedResult, page, "/api/datasets?");
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

  /**
   * Before triggering this endpoint. There are pre-requisite to be able to record the data.
   * A dataset with a single datasetCase must exist with the correct dataset uri.
   * Enter the following for edgeDb cli
   * insert dataset::Dataset{
   *   description:="New Cardaic",
   *   cases:= (insert dataset::DatasetCase{}),
   *   uri:= "urn:fdc:australiangenomics.org.au:2022:datasets/cardiac"
   * };
   */
  fastify.post<{ Body: { keyPrefix: string } }>(
    "/api/datasets/ag/import",
    {},
    async function (request, reply) {
      const body = request.body;
      const keyPrefix = body.keyPrefix;

      agService.syncDbFromS3KeyPrefix(keyPrefix);
      reply.send("ok");
    }
  );
};
