import e from "../../../dbschema/edgeql-js";
import { audit } from "../../../dbschema/interfaces";
import DataAccessAuditEvent = audit.DataAccessAuditEvent;
import ReleaseAuditEvent = audit.ReleaseAuditEvent;
import AuditEvent = audit.AuditEvent;
import { RouteValidation } from "@umccr/elsa-types";
import AuditEventUserFilterType = RouteValidation.AuditEventUserFilterType;

/**
 * An EdgeDb query to count the audit log entries not associated
 * with any release (i.e the system entries like Login, Logout)
 */
export const countAuditLogEntriesForSystemQuery = e.count(
  e.select(e.audit.ReleaseAuditEvent)
);

/**
 * An EdgeDb query to count the audit log entries associated
 * with a given release.
 */
export const countAuditLogEntriesForReleaseQuery = e.params(
  {
    releaseId: e.uuid,
  },
  (params) =>
    e.count(
      e.select(e.audit.ReleaseAuditEvent, (ae) => ({
        filter: e.op(ae.release_.id, "=", params.releaseId),
      }))
    )
);

/**
 * An EdgeDb query to count the audit log entries associated
 * with a given user.
 */
export const countAuditLogEntriesForUserQuery = e.params(
  {
    userId: e.uuid,
  },
  (params) =>
    e.count(
      e.select(e.audit.UserAuditEvent, (ae) => ({
        filter: e.op(ae.user_.id, "=", params.userId),
      }))
    )
);

/**
 * An EdgeDb query to count the DataAccessAudit log entries associated
 * with a given release.
 */
export const countDataAccessAuditLogEntriesQuery = e.params(
  {
    releaseId: e.uuid,
  },
  (params) =>
    e.count(
      e.select(e.audit.DataAccessAuditEvent, (da) => ({
        filter: e.op(da.release_.id, "=", params.releaseId),
      }))
    )
);

/**
 * Common properties for audit events.
 */
export const auditEventProperties = {
  id: true,
  whoId: true,
  whoDisplayName: true,
  actionCategory: true,
  actionDescription: true,
  recordedDateTime: true,
  updatedDateTime: true,
  occurredDateTime: true,
  occurredDuration: true,
  outcome: true,
} as const;

/**
 * An EdgeDb query for the audit log details associated with an id.
 */
export const auditLogDetailsForIdQuery = (
  id: string,
  start: number,
  end: number
) => {
  const detailsStr = (auditEvent: any) =>
    e.to_str(auditEvent.details, "pretty");

  return e.select(e.audit.AuditEvent, (auditEvent) => ({
    id: true,
    detailsStr: detailsStr(auditEvent).slice(start, end),
    truncated: e.op(e.len(detailsStr(auditEvent)), ">=", end),
    filter_single: { id: e.uuid(id) },
  }));
};

/**
 * An EdgeDb query for the full audit log event associated with an id.
 */
export const auditLogFullForIdQuery = (id: string) => {
  return e.select(e.audit.AuditEvent, (_) => ({
    ...e.audit.AuditEvent["*"],
    filter_single: { id: e.uuid(id) },
  }));
};

/**
 * A pageable EdgeDb query for the audit log entries associated with
 * a given release.
 */
export const pageableAuditLogEntriesForReleaseQuery = (
  releaseId: string,
  limit: number,
  offset: number,
  orderByProperty: keyof ReleaseAuditEvent = "occurredDateTime",
  orderAscending: boolean = false
) => {
  return e.select(e.audit.ReleaseAuditEvent, (auditEvent) => ({
    ...auditEventProperties,
    hasDetails: e.op("exists", auditEvent.details),
    filter: e.op(auditEvent.release_.id, "=", e.uuid(releaseId)),
    order_by: [
      {
        expression:
          orderByProperty === "actionCategory"
            ? e.cast(e.str, auditEvent.actionCategory)
            : auditEvent[orderByProperty],
        direction: orderAscending ? e.ASC : e.DESC,
      },
      {
        expression: auditEvent.occurredDateTime,
        direction: e.DESC,
      },
    ],
    limit: limit,
    offset: offset,
  }));
};

/**
 * A pageable EdgeDb query for the audit log entries associated with
 * a given release.
 */
export const pageableAuditEventsForUserInRelease = (
  userIds: [string] | "all",
  limit: number,
  offset: number,
  computeDetails: boolean = true,
  paginate: boolean = true,
  orderByProperty: keyof ReleaseAuditEvent = "occurredDateTime",
  orderAscending: boolean = false
) => {
  return e.select(
    e.audit.AuditEvent.is(e.audit.ReleaseAuditEvent),
    (auditEvent) => ({
      ...auditEventProperties,
      ...(computeDetails && {
        hasDetails: e.op("exists", auditEvent.details),
      }),
      ...(userIds !== "all" && {
        filter: e.op(
          e.array_unpack(e.literal(e.array(e.uuid), userIds)),
          "in",
          auditEvent.release_.participants.id
        ),
      }),
      ...(paginate && {
        order_by: [
          {
            expression:
              orderByProperty === "actionCategory"
                ? e.cast(e.str, auditEvent.actionCategory)
                : auditEvent[orderByProperty],
            direction: orderAscending ? e.ASC : e.DESC,
          },
          {
            expression: auditEvent.occurredDateTime,
            direction: e.DESC,
          },
        ],
        limit: limit,
        offset: offset,
      }),
    })
  );
};

/**
 * A pageable EdgeDb query for the audit log events associated with
 * a given user and system events.
 */
export const pageableAuditEventsQuery = (
  filter: Omit<AuditEventUserFilterType, "all">[],
  userIds: [string] | "all",
  limit: number,
  offset: number,
  paginate: boolean = true,
  orderByProperty: keyof AuditEvent = "occurredDateTime",
  orderAscending: boolean = false
) => {
  const union = e.for(
    e.array_unpack(
      e.literal(
        e.array(e.str),
        filter.map((v) => v.toString())
      )
    ),
    (f) => {
      return e.op(
        pageableAuditEventsForUserInRelease(
          userIds,
          limit,
          offset,
          false,
          false,
          orderByProperty,
          orderAscending
        ),
        "if",
        e.op(f, "=", "release"),
        "else",
        e.op(
          pageableAuditLogEntriesForUserQuery(
            userIds,
            limit,
            offset,
            false,
            false,
            orderByProperty,
            orderAscending
          ),
          "if",
          e.op(f, "=", "user"),
          "else",
          pageableAuditLogEntriesForSystemQuery(
            limit,
            offset,
            false,
            false,
            orderByProperty,
            orderAscending
          )
        )
      );
    }
  );

  return {
    count: e.count(union),
    entries: e.select(union, (auditEvent) => ({
      ...auditEventProperties,
      hasDetails: e.op("exists", auditEvent.details),
      ...(paginate && {
        order_by: [
          {
            expression:
              orderByProperty === "actionCategory"
                ? e.cast(e.str, auditEvent.actionCategory)
                : auditEvent[orderByProperty],
            direction: orderAscending ? e.ASC : e.DESC,
          },
          {
            expression: auditEvent.occurredDateTime,
            direction: e.DESC,
          },
        ],
        limit: limit,
        offset: offset,
      }),
    })),
  };
};

/**
 * A pageable EdgeDb query for the audit log entries associated with
 * a given user.
 */
export const pageableAuditLogEntriesForUserQuery = (
  userIds: [string] | "all",
  limit: number,
  offset: number,
  computeDetails: boolean = true,
  paginate: boolean = true,
  orderByProperty: keyof AuditEvent = "occurredDateTime",
  orderAscending: boolean = false
) => {
  return e.select(
    e.audit.AuditEvent.is(e.audit.UserAuditEvent),
    (auditEvent) => ({
      ...auditEventProperties,
      ...(computeDetails && {
        hasDetails: e.op("exists", auditEvent.details),
      }),
      ...(userIds !== "all" && {
        filter: e.contains(
          e.literal(e.array(e.uuid), userIds),
          auditEvent.user_.id
        ),
      }),
      ...(paginate && {
        order_by: [
          {
            expression:
              orderByProperty === "actionCategory"
                ? e.cast(e.str, auditEvent.actionCategory)
                : auditEvent[orderByProperty],
            direction: orderAscending ? e.ASC : e.DESC,
          },
          {
            expression: auditEvent.occurredDateTime,
            direction: e.DESC,
          },
        ],
        limit: limit,
        offset: offset,
      }),
    })
  );
};

export const selectDataAccessAuditEventByReleaseIdQuery = (
  releaseId: string,
  limit: number,
  offset: number,
  orderByProperty:
    | keyof DataAccessAuditEvent
    | "fileUrl"
    | "fileSize" = "occurredDateTime",
  orderAscending: boolean = false
) => {
  return e.select(e.audit.DataAccessAuditEvent, (da) => ({
    ...e.audit.DataAccessAuditEvent["*"],
    fileSize: da.details.size,
    fileUrl: da.details.url,
    filter: e.op(da.release_.id, "=", e.uuid(releaseId)),
    order_by: [
      {
        expression:
          orderByProperty === "actionCategory"
            ? e.cast(e.str, da.actionCategory)
            : orderByProperty === "fileUrl"
            ? da.details.url
            : orderByProperty === "fileSize"
            ? da.details.fileUrl
            : da[orderByProperty],
        direction: orderAscending ? e.ASC : e.DESC,
      },
      {
        expression: da.occurredDateTime,
        direction: e.DESC,
      },
    ],
    limit: limit,
    offset: offset,
  }));
};

/**
 * A pageable EdgeDb query for system audit log entries.
 */
export const pageableAuditLogEntriesForSystemQuery = (
  limit: number,
  offset: number,
  computeDetails: boolean = true,
  paginate: boolean = true,
  orderByProperty: keyof AuditEvent = "occurredDateTime",
  orderAscending: boolean = false
) => {
  return e.select(
    e.audit.AuditEvent.is(e.audit.SystemAuditEvent),
    (auditEvent) => ({
      ...auditEventProperties,
      ...(computeDetails && {
        hasDetails: e.op("exists", auditEvent.details),
      }),
      ...(paginate && {
        order_by: [
          {
            expression:
              orderByProperty === "actionCategory"
                ? e.cast(e.str, auditEvent.actionCategory)
                : auditEvent[orderByProperty],
            direction: orderAscending ? e.ASC : e.DESC,
          },
          {
            expression: auditEvent.occurredDateTime,
            direction: e.DESC,
          },
        ],
        limit: limit,
        offset: offset,
      }),
    })
  );
};
