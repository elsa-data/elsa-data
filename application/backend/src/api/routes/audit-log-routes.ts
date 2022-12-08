import { FastifyInstance } from "fastify";
import { AuditEntryType } from "@umccr/elsa-types";
import {
  authenticatedRouteOnEntryHelper,
  sendPagedResult,
  sendResult,
} from "../api-routes";
import * as edgedb from "edgedb";
import { container } from "tsyringe";
import { AuditLogService } from "../../business/services/audit-log-service";
import { Static, Type } from "@sinclair/typebox";
import {
  AuditDataAccessType,
  AuditEntryDetailsType,
  AuditEntryFullType,
} from "@umccr/elsa-types/schemas-audit";
import { AwsCloudTrailLakeService } from "../../business/services/aws-cloudtrail-lake-service";
import { DatasetService } from "../../business/services/dataset-service";

export const AuditEventForReleaseQuerySchema = Type.Object({
  page: Type.Optional(Type.Number()),
  orderByProperty: Type.Optional(Type.String()),
  orderAscending: Type.Optional(Type.Boolean()),
});
export type AuditEventForReleastQueryType = Static<
  typeof AuditEventForReleaseQuerySchema
>;

export const AuditEventByIdQuerySchema = Type.Object({
  id: Type.String(),
});
export type AuditEventFullQueryType = Static<typeof AuditEventByIdQuerySchema>;

export const AuditEventDetailsQuerySchema = Type.Object({
  ...AuditEventByIdQuerySchema.properties,
  start: Type.Optional(Type.Number()),
  end: Type.Optional(Type.Number()),
});
export type AuditEventDetailsQueryType = Static<
  typeof AuditEventDetailsQuerySchema
>;

export const auditLogRoutes = async (fastify: FastifyInstance, _opts: any) => {
  const edgeDbClient = container.resolve<edgedb.Client>("Database");
  const datasetService = container.resolve<DatasetService>(DatasetService);
  const auditLogService = container.resolve<AuditLogService>(AuditLogService);
  const awsCloudTrailLakeService = container.resolve(AwsCloudTrailLakeService);

  fastify.get<{
    Params: { releaseId: string };
    Reply: AuditEntryType[];
    Querystring: AuditEventForReleastQueryType;
  }>(
    "/api/releases/:releaseId/audit-log",
    {
      schema: {
        querystring: AuditEventForReleaseQuerySchema,
      },
    },
    async function (request, reply) {
      const { authenticatedUser, pageSize, page } =
        authenticatedRouteOnEntryHelper(request);

      const releaseId = request.params.releaseId;
      const { orderByProperty = "occurredDateTime", orderAscending = false } =
        request.query;

      const events = await auditLogService.getEntries(
        edgeDbClient,
        authenticatedUser,
        releaseId,
        pageSize,
        (page - 1) * pageSize,
        orderByProperty,
        orderAscending
      );

      sendPagedResult(reply, events);
    }
  );

  fastify.get<{
    Params: { releaseId: string };
    Reply: AuditEntryDetailsType | null;
    Querystring: AuditEventDetailsQueryType;
  }>(
    "/api/releases/:releaseId/audit-log/details",
    {
      schema: {
        querystring: AuditEventDetailsQuerySchema,
      },
    },
    async function (request, reply) {
      const { authenticatedUser } = authenticatedRouteOnEntryHelper(request);

      const { id, start = 0, end = -1 } = request.query;

      const events = await auditLogService.getEntryDetails(
        edgeDbClient,
        authenticatedUser,
        id,
        start,
        end
      );

      sendResult(reply, events);
    }
  );

  fastify.get<{
    Params: { releaseId: string; objectId: string };
    Reply: AuditEntryFullType | null;
  }>(
    "/api/releases/:releaseId/audit-log/:objectId",
    async function (request, reply) {
      const { authenticatedUser } = authenticatedRouteOnEntryHelper(request);

      const events = await auditLogService.getFullEntry(
        edgeDbClient,
        authenticatedUser,
        request.params.objectId
      );

      sendResult(reply, events);
    }
  );

  fastify.get<{
    Params: { releaseId: string };
    Reply: AuditDataAccessType[] | null;
    Querystring: AuditEventForReleastQueryType;
  }>(
    "/api/releases/:releaseId/audit-log/data-access",
    {
      schema: {
        querystring: AuditEventForReleaseQuerySchema,
      },
    },
    async function (request, reply) {
      const { authenticatedUser, pageSize, page } =
        authenticatedRouteOnEntryHelper(request);

      const releaseId = request.params.releaseId;
      const { orderByProperty = "occurredDateTime", orderAscending = false } =
        request.query;

      const events = await auditLogService.getDataAccessAuditByReleaseId(
        edgeDbClient,
        authenticatedUser,
        releaseId,
        pageSize,
        (page - 1) * pageSize,
        orderByProperty,
        orderAscending
      );

      sendPagedResult(reply, events);
    }
  );

  fastify.get<{
    Params: { releaseId: string };
    Reply: AuditDataAccessType[] | null;
  }>(
    "/api/releases/:releaseId/audit-log/data-access/summary",
    async function (request, reply) {
      const { authenticatedUser } = authenticatedRouteOnEntryHelper(request);

      const events = await auditLogService.getSummaryDataAccessAuditByReleaseId(
        edgeDbClient,
        authenticatedUser,
        request.params.releaseId
      );

      sendResult(reply, events);
    }
  );

  fastify.post<{
    Params: {
      rid: string;
      accessType: "aws-presign"; // Expansion: ['aws-access-point', 'gcp-presign', ...]
    };
    Body: {};
    Reply: string;
  }>(
    "/api/releases/:rid/access-log/import/:accessType",
    {},
    async function (request, reply) {
      const { authenticatedUser } = authenticatedRouteOnEntryHelper(request);

      const releaseId = request.params.rid;
      const accessType = request.params.accessType;

      let replyMessage = "";

      switch (accessType) {
        case "aws-presign":
          // Get datasets URI
          const datasetUriArr =
            await datasetService.getDatasetUrisFromReleaseId(releaseId);
          if (!datasetUriArr) {
            replyMessage = "No dataset found!";
            break;
          }

          const eventDataStoreIds =
            await awsCloudTrailLakeService.getEventDataStoreIdFromDatasetUris(
              datasetUriArr
            );
          if (!eventDataStoreIds) {
            replyMessage =
              "No AWS Event Data Store Id found in configuration file!";
            break;
          }

          if (datasetUriArr.length != eventDataStoreIds.length) {
            replyMessage =
              "Not all dataset in this release have corresponding AWS config for presign URL sync.";
          }

          await awsCloudTrailLakeService.syncPresignCloudTrailLakeLog({
            releaseId,
            eventDataStoreIds,
          });
          replyMessage +=
            "\nSuccessfully sync from AWS Cloud Trail Lake events!";
      }
      reply.send(replyMessage);
    }
  );
};
