import e from "../../../dbschema/edgeql-js";
import { audit } from "../../../dbschema/interfaces";
import UserAuditEvent = audit.UserAuditEvent;
import DataAccessAuditEvent = audit.DataAccessAuditEvent;
import SystemAuditEvent = audit.SystemAuditEvent;
import ReleaseAuditEvent = audit.ReleaseAuditEvent;

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
 * An EdgeDb query for the audit log details associated with an id.
 */
export const auditLogDetailsForIdQuery = (
  id: string,
  start: number,
  end: number
) => {
  const detailsStr = (auditEvent: any) =>
    e.to_str(auditEvent.details, "pretty");
  return e.select(e.audit.ReleaseAuditEvent, (auditEvent) => ({
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
  return e.select(e.audit.ReleaseAuditEvent, (_) => ({
    ...e.audit.ReleaseAuditEvent["*"],
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
 * a given user.
 */
export const pageableAuditLogEntriesForUserQuery = (
  userId: string,
  limit: number,
  offset: number,
  orderByProperty: keyof UserAuditEvent = "occurredDateTime",
  orderAscending: boolean = false
) => {
  return e.select(e.audit.UserAuditEvent, (auditEvent) => ({
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
    hasDetails: e.op("exists", auditEvent.details),
    filter: e.op(auditEvent.user_.id, "=", e.uuid(userId)),
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
  orderByProperty: keyof SystemAuditEvent = "occurredDateTime",
  orderAscending: boolean = false
) => {
  return e.select(e.audit.SystemAuditEvent, (auditEvent) => ({
    id: true,
    actionCategory: true,
    actionDescription: true,
    recordedDateTime: true,
    updatedDateTime: true,
    occurredDateTime: true,
    occurredDuration: true,
    outcome: true,
    hasDetails: e.op("exists", auditEvent.details),
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
