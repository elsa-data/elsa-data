import { FastifyInstance } from "fastify";
import {
  authenticatedRouteOnEntryHelper,
  sendPagedResult,
  sendResult,
  sendUncheckedPagedResult,
} from "../../api-internal-routes";
import * as edgedb from "edgedb";
import { container } from "tsyringe";
import { AuditLogService } from "../../../business/services/audit-log-service";
import { AwsCloudTrailLakeService } from "../../../business/services/aws-cloudtrail-lake-service";
import { DatasetService } from "../../../business/services/dataset-service";
import { audit } from "../../../../dbschema/interfaces";
import DataAccessAuditEvent = audit.DataAccessAuditEvent;
import AuditEvent = audit.AuditEvent;
import {
  AuditDataAccessType,
  AuditEventDetailsType,
  AuditEventType,
  AuditEventFullType,
  RouteValidation,
} from "@umccr/elsa-types";
import { ElsaSettings } from "../../../config/elsa-settings";
import _ from "lodash";
import AuditEventForQuerySchema = RouteValidation.AuditEventForQuerySchema;
import AuditEventForQueryType = RouteValidation.AuditEventForQueryType;
import AuditEventDetailsQueryType = RouteValidation.AuditEventDetailsQueryType;
import AuditEventDetailsQuerySchema = RouteValidation.AuditEventDetailsQuerySchema;
import { ALLOWED_VIEW_AUDIT_EVENTS } from "@umccr/elsa-constants";

export const auditEventRoutes = async (
  fastify: FastifyInstance,
  _opts: any
) => {
  const settings = container.resolve<ElsaSettings>("Settings");
  const edgeDbClient = container.resolve<edgedb.Client>("Database");
  const datasetService = container.resolve<DatasetService>(DatasetService);
  const auditLogService = container.resolve<AuditLogService>(AuditLogService);
  const awsCloudTrailLakeService = container.resolve(AwsCloudTrailLakeService);

  fastify.get<{
    Params: { releaseId: string };
    Reply: AuditEventType[];
    Querystring: AuditEventForQueryType;
  }>(
    "/releases/:releaseId/audit-event",
    {
      schema: {
        querystring: AuditEventForQuerySchema,
      },
    },
    async function (request, reply) {
      const { authenticatedUser, pageSize, page } =
        authenticatedRouteOnEntryHelper(request);

      const releaseId = request.params.releaseId;
      const { orderByProperty = "occurredDateTime", orderAscending = false } =
        request.query;

      const events = await auditLogService.getReleaseEntries(
        edgeDbClient,
        authenticatedUser,
        releaseId,
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
    Params: { releaseId: string };
    Reply: AuditDataAccessType[] | null;
    Querystring: AuditEventForQueryType;
  }>(
    "/releases/:releaseId/audit-event/data-access",
    {
      schema: {
        querystring: AuditEventForQuerySchema,
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
        orderByProperty as keyof DataAccessAuditEvent | "fileUrl" | "fileSize",
        orderAscending
      );

      sendPagedResult(reply, events);
    }
  );

  fastify.get<{
    Params: { releaseId: string };
    Reply: AuditDataAccessType[] | null;
  }>(
    "/releases/:releaseId/audit-event/data-access/summary",
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
    };
    Body: {
      accessType: "aws";
    };
    Reply: string;
  }>(
    "/releases/:rid/access-log/sync",
    {
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          properties: {
            accessType: {
              type: "string",
              enum: ["aws"], // Expansion: ['aws', 'gcp', ...]
            },
          },
          required: ["accessType"],
        },
      },
    },
    async function (request, reply) {
      const { authenticatedUser } = authenticatedRouteOnEntryHelper(request);

      const releaseId = request.params.rid;
      const accessType = request.body.accessType;

      let replyMessage = "";

      switch (accessType) {
        case "aws":
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
              "Not all dataset in this release have corresponding AWS config for access logs";
          }

          await awsCloudTrailLakeService.fetchCloudTrailLakeLog({
            user: authenticatedUser,
            releaseId,
            eventDataStoreIds,
          });
          replyMessage +=
            "\nSuccessfully sync from AWS Cloud Trail Lake events!";
      }

      reply.send(replyMessage);
    }
  );

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

      if (
        (filter.includes("all") || filter.includes("system")) &&
        !request.session.get(ALLOWED_VIEW_AUDIT_EVENTS)
      ) {
        reply.status(404).send();
      } else if (filter.length === 0) {
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
