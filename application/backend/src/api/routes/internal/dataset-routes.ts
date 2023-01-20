import { FastifyInstance } from "fastify";
import {
  DatasetDeepType,
  DatasetGen3SyncRequestType,
  DatasetGen3SyncResponseType,
  DatasetLightType,
  DuoLimitationCodedType,
} from "@umccr/elsa-types";
import { datasetGen3SyncRequestValidate } from "../../../validators/validate-json";
import { container } from "tsyringe";
import { DatasetService } from "../../../business/services/dataset-service";
import { S3IndexApplicationService } from "../../../business/services/australian-genomics/s3-index-import-service";
import {
  authenticatedRouteOnEntryHelper,
  sendPagedResult,
} from "../../api-internal-routes";
import { Static, Type } from "@sinclair/typebox";
import { ElsaSettings } from "../../../config/elsa-settings";

export const DatasetSummaryQuerySchema = Type.Object({
  includeDeletedFile: Type.Optional(Type.String()),
});
export type DatasetSummaryQueryType = Static<typeof DatasetSummaryQuerySchema>;

export const datasetRoutes = async (fastify: FastifyInstance) => {
  const datasetsService = container.resolve(DatasetService);
  const agService = container.resolve(S3IndexApplicationService);
  const settings = container.resolve<ElsaSettings>("Settings");
  /**
   * Pageable fetching of top-level dataset information (summary level info)
   */
  fastify.get<{
    Querystring: DatasetSummaryQueryType;
    Reply: DatasetLightType[];
  }>("/datasets/", {}, async function (request, reply) {
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
    "/datasets/:did",
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

  fastify.get<{
    Params: { cid: string };
    Reply: DuoLimitationCodedType[];
  }>("/datasets/consent/:cid", {}, async function (request, reply) {
    const { authenticatedUser } = authenticatedRouteOnEntryHelper(request);

    const cid = request.params.cid;

    const r = await datasetsService.getDatasetsConsent(authenticatedUser, cid);

    request.log.debug(r);

    reply.send(r);
  });

  fastify.post<{
    Request: DatasetGen3SyncRequestType;
    Reply: DatasetGen3SyncResponseType;
  }>("/datasets", {}, async function (request, reply) {
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

  fastify.post<{ Body: { datasetURI: string } }>(
    "/datasets/sync/",
    {},
    async function (request, reply) {
      const body = request.body;
      const datasetUri = body.datasetURI;
      const elsaSettings: ElsaSettings = (request as any).settings;

      // TODO: Support more import method accordingly
      // TODO: Some error when datasetUri not found
      agService.syncDbFromDatasetUri(datasetUri);
      reply.send(
        "OK! \nTo prevent API timeout, returning the OK while importing might still run in the background. "
      );
    }
  );
};
