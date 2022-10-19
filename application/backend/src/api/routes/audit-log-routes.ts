import { FastifyInstance } from "fastify";
import { AuditEntryType } from "@umccr/elsa-types";
import {
  authenticatedRouteOnEntryHelper,
  sendPagedResult,
} from "../api-routes";
import * as edgedb from "edgedb";
import { container } from "tsyringe";
import { AuditLogService } from "../../business/services/audit-log-service";

export const auditLogRoutes = async (fastify: FastifyInstance, _opts: any) => {
  const edgeDbClient = container.resolve<edgedb.Client>("Database");
  const auditLogService = container.resolve<AuditLogService>(AuditLogService);

  fastify.get<{ Params: { rid: string }; Reply: AuditEntryType[] }>(
    "/api/releases/:rid/audit-log",
    {},
    async function (request, reply) {
      const { authenticatedUser, pageSize, page } =
        authenticatedRouteOnEntryHelper(request);

      const releaseId = request.params.rid;

      const events = await auditLogService.getEntries(
        edgeDbClient,
        authenticatedUser,
        releaseId,
        pageSize,
        (page - 1) * pageSize
      );

      sendPagedResult(
        reply,
        events,
        page,
        `/api/releases/${releaseId}/audit-log?`
      );
    }
  );
};
