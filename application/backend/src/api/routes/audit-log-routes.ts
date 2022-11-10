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
  const auditLogService = container.resolve<AuditLogService>(AuditLogService);

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
    Params: { releaseId: string; objectId: string };
    Reply: AuditDataAccessType[] | null;
  }>(
    "/api/releases/:releaseId/audit-log/:objectId/data-access",
    async function (request, reply) {
      const { authenticatedUser } = authenticatedRouteOnEntryHelper(request);

      const events = await auditLogService.getDataAccessAuditByReleaseId(
        edgeDbClient,
        authenticatedUser,
        request.params.releaseId
      );

      sendResult(reply, events);
    }
  );

  fastify.get<{
    Params: { releaseId: string };
    Reply: AuditDataAccessType[] | null;
  }>(
    "/api/releases/:releaseId/audit-log/data-access",
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
};
