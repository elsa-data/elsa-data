import { FastifyInstance } from "fastify";
import { AuditEntryType } from "@umccr/elsa-types";
import {
  authenticatedRouteOnEntryHelper,
  sendPagedResult,
} from "../api-routes";
import * as edgedb from "edgedb";
import { container } from "tsyringe";
import { AuditLogService } from "../../business/services/audit-log-service";
import { Static, Type } from "@sinclair/typebox";

export const DetailsQueryStringSchema = Type.Object({
  start: Type.Optional(Type.Number()),
  end: Type.Optional(Type.Number()),
});

export type DetailsQueryStringType = Static<typeof DetailsQueryStringSchema>;

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

  // fastify.get<{ Params: { rid: string }; Reply: AuditEntryDetailsType[], Querystring: DetailsQueryStringType }>(
  //   "/api/releases/:rid/audit-log/details",
  //   {
  //     schema: {
  //       querystring: DetailsQueryStringSchema
  //     }
  //   },
  //   async function (request, reply) {
  //     const { authenticatedUser, pageSize, page } =
  //       authenticatedRouteOnEntryHelper(request);
  //
  //     const releaseId = request.params.rid;
  //     const { start, end } = request.query;
  //
  //     const events = await auditLogService.getEntryDetails(
  //       edgeDbClient,
  //       authenticatedUser,
  //       releaseId,
  //       pageSize,
  //       (page - 1) * pageSize,
  //       start,
  //       end
  //     );
  //
  //     sendPagedResult(
  //       reply,
  //       events,
  //       page,
  //       `/api/releases/${releaseId}/audit-log/details?`
  //     );
  //   }
  // );
};
