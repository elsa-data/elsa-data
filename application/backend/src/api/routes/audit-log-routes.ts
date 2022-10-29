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
import { AuditEntryDetailsType } from "@umccr/elsa-types/schemas-audit";

export const DetailsQueryStringSchema = Type.Object({
  page: Type.Optional(Type.Number()),
  orderByProperty: Type.Optional(Type.String()),
  orderAscending: Type.Optional(Type.Boolean()),
});

export type DetailsQueryStringType = Static<typeof DetailsQueryStringSchema>;

export const DetailsQueryStringDetailsSchema = Type.Object({
  id: Type.String(),
  start: Type.Optional(Type.Number()),
  end: Type.Optional(Type.Number()),
});

export type DetailsQueryStringDetailsType = Static<
  typeof DetailsQueryStringDetailsSchema
>;

export const auditLogRoutes = async (fastify: FastifyInstance, _opts: any) => {
  const edgeDbClient = container.resolve<edgedb.Client>("Database");
  const auditLogService = container.resolve<AuditLogService>(AuditLogService);

  fastify.get<{
    Params: { rid: string };
    Reply: AuditEntryType[];
    Querystring: DetailsQueryStringType;
  }>(
    "/api/releases/:rid/audit-log",
    {
      schema: {
        querystring: DetailsQueryStringSchema,
      },
    },
    async function (request, reply) {
      const { authenticatedUser, pageSize, page } =
        authenticatedRouteOnEntryHelper(request);

      const releaseId = request.params.rid;
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
    Params: { rid: string };
    Reply: AuditEntryDetailsType | null;
    Querystring: DetailsQueryStringDetailsType;
  }>(
    "/api/releases/:rid/audit-log/details",
    {
      schema: {
        querystring: DetailsQueryStringDetailsSchema,
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
};
