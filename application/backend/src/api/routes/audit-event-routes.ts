import { FastifyInstance } from "fastify";
import { container } from "tsyringe";
import * as edgedb from "edgedb";
import {
  authenticatedRouteOnEntryHelper,
  sendPagedResult,
} from "../api-routes";
import { Static, Type } from "@sinclair/typebox";
import { AuditEventType } from "../../../../../../../../../mnt/Shared/Documents/elsa-data/application/common/elsa-types/schemas-audit-events";
import { AuditEventService } from "../../business/services/audit-event-service";

export const AuditEventQuerySchema = Type.Object({});
export type AuditEventQueryType = Static<typeof AuditEventQuerySchema>;

export const auditEventRoutes = async (
  fastify: FastifyInstance,
  _opts: any
) => {
  const edgeDbClient = container.resolve<edgedb.Client>("Database");
  const auditEntryService =
    container.resolve<AuditEventService>(AuditEventService);

  fastify.get<{
    Params: { releaseId: string };
    Reply: AuditEventType[];
    Querystring: AuditEventQueryType;
  }>(
    "/api/audit-events",
    {
      schema: {
        querystring: AuditEventQuerySchema,
      },
    },
    async function (request, reply) {
      const { authenticatedUser, pageSize, page } =
        authenticatedRouteOnEntryHelper(request);

      sendPagedResult(reply, null);
    }
  );
};
