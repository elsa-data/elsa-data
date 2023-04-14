import { FastifyInstance } from "fastify";
import {
  authenticatedRouteOnEntryHelper,
  sendPagedResult,
  sendResult,
  sendUncheckedPagedResult,
} from "../../api-internal-routes";
import * as edgedb from "edgedb";
import { AuditLogService } from "../../../business/services/audit-log-service";
import { AwsCloudTrailLakeService } from "../../../business/services/aws/aws-cloudtrail-lake-service";
import { DatasetService } from "../../../business/services/dataset-service";
import * as interfaces from "../../../../dbschema/interfaces";
import {
  AuditEventDetailsType,
  AuditEventFullType,
  AuditEventType,
  RouteValidation,
} from "@umccr/elsa-types";
import { ElsaSettings } from "../../../config/elsa-settings";
import _ from "lodash";
import { DependencyContainer } from "tsyringe";
import AuditEvent = interfaces.audit.AuditEvent;
import AuditEventForQuerySchema = RouteValidation.AuditEventForQuerySchema;
import AuditEventForQueryType = RouteValidation.AuditEventForQueryType;
import AuditEventDetailsQueryType = RouteValidation.AuditEventDetailsQueryType;
import AuditEventDetailsQuerySchema = RouteValidation.AuditEventDetailsQuerySchema;

export const auditEventRoutes = async (
  fastify: FastifyInstance,
  _opts: {
    container: DependencyContainer;
  }
) => {
  const settings = _opts.container.resolve<ElsaSettings>("Settings");
  const edgeDbClient = _opts.container.resolve<edgedb.Client>("Database");
  const datasetService =
    _opts.container.resolve<DatasetService>(DatasetService);
  const auditLogService =
    _opts.container.resolve<AuditLogService>(AuditLogService);
  const awsCloudTrailLakeService = _opts.container.resolve(
    AwsCloudTrailLakeService
  );

  fastify.get<{
    Params: { releaseKey: string };
    Reply: AuditEventType[];
    Querystring: AuditEventForQueryType;
  }>(
    "/releases/:releaseKey/audit-event",
    {
      schema: {
        querystring: AuditEventForQuerySchema,
      },
    },
    async function (request, reply) {
      const { authenticatedUser, pageSize, page } =
        authenticatedRouteOnEntryHelper(request);

      const releaseKey = request.params.releaseKey;
      const { orderByProperty = "occurredDateTime", orderAscending = false } =
        request.query;

      const events = await auditLogService.getReleaseEntries(
        edgeDbClient,
        authenticatedUser,
        releaseKey,
        pageSize,
        (page - 1) * pageSize,
        orderByProperty as keyof AuditEvent,
        orderAscending
      );

      sendPagedResult(reply, events);
    }
  );

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
    Params: { objectId: string };
    Reply: AuditEventFullType | null;
  }>("/audit-event/details/:objectId", async function (request, reply) {
    const { authenticatedUser } = authenticatedRouteOnEntryHelper(request);

    const events = await auditLogService.getFullEntry(
      edgeDbClient,
      authenticatedUser,
      request.params.objectId
    );

    sendResult(reply, events);
  });

  fastify.get<{
    Params: {};
    Reply: AuditEventType[];
    Querystring: AuditEventForQueryType;
  }>(
    "/audit-event",
    {
      schema: {
        querystring: AuditEventForQuerySchema,
      },
    },
    async function (request, reply) {
      const { authenticatedUser, pageSize, page } =
        authenticatedRouteOnEntryHelper(request);

      const {
        orderByProperty = "occurredDateTime",
        orderAscending = false,
        filter = [],
      } = request.query;

      if (filter.length === 0) {
        sendUncheckedPagedResult(reply, { data: [], total: 0 });
      } else {
        const events = await auditLogService.getUserEntries(
          edgeDbClient,
          _.uniq(filter),
          authenticatedUser,
          pageSize,
          (page - 1) * pageSize,
          true,
          orderByProperty as keyof AuditEvent,
          orderAscending
        );

        sendPagedResult(reply, events);
      }
    }
  );
};
