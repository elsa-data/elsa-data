import { FastifyInstance } from "fastify";
import {
  authenticatedRouteOnEntryHelper,
  sendResult,
} from "../../api-internal-routes";
import * as edgedb from "edgedb";
import { AuditEventService } from "../../../business/services/audit-event-service";
import {
  AuditEventDetailsType,
  AuditEventFullType,
  RouteValidation,
} from "@umccr/elsa-types";
import { DependencyContainer } from "tsyringe";
import AuditEventDetailsQueryType = RouteValidation.AuditEventDetailsQueryType;
import AuditEventDetailsQuerySchema = RouteValidation.AuditEventDetailsQuerySchema;

export const auditEventRoutes = async (
  fastify: FastifyInstance,
  _opts: {
    container: DependencyContainer;
  }
) => {
  const edgeDbClient = _opts.container.resolve<edgedb.Client>("Database");
  const auditLogService =
    _opts.container.resolve<AuditEventService>(AuditEventService);

  fastify.get<{
    Params: {};
    Reply: AuditEventDetailsType | null;
    Querystring: AuditEventDetailsQueryType;
  }>(
    "/audit-event/truncated-details",
    {
      schema: {
        querystring: AuditEventDetailsQuerySchema,
      },
    },
    async function (request, reply) {
      const { authenticatedUser } = authenticatedRouteOnEntryHelper(request);

      const { id, start = 0, end = -1 } = request.query;

      const events = await auditLogService.getEntryDetails(
        authenticatedUser,
        id,
        start,
        end,
        edgeDbClient
      );

      sendResult(reply, events);
    }
  );

  fastify.get<{
    Params: { objectId: string };
    Reply: AuditEventFullType | null;
  }>("/audit-event/details/:objectId", async function (request, reply) {
    const { authenticatedUser } = authenticatedRouteOnEntryHelper(request);

    const events = await auditLogService.getFullEntry(
      authenticatedUser,
      request.params.objectId,
      edgeDbClient
    );

    sendResult(reply, events);
  });
};
