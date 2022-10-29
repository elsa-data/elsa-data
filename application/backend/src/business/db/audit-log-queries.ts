import e from "../../../dbschema/edgeql-js";

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
        filter: e.op(
          ae["<auditLog[is release::Release]"].id,
          "=",
          params.releaseId
        ),
      }))
    )
);

/**
 * A pageable EdgeDb query for the audit log entries associated with
 * a given release.
 */
export const auditLogDetailsForIdQuery = (
  id: string,
  start: number,
  end: number
) => {
  return e.select(e.audit.ReleaseAuditEvent, (auditEvent) => ({
    id: true,
    detailsStr: e.to_str(auditEvent.details).slice(start, end),
    filter: e.op(auditEvent.id, "=", e.uuid(id)),
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
  orderByProperty: string = "occurredDateTime",
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
    filter: e.op(
      auditEvent["<auditLog[is release::Release]"].id,
      "=",
      e.uuid(releaseId)
    ),
    order_by: [
      {
        expression:
          orderByProperty === "whoId"
            ? auditEvent.whoId
            : orderByProperty === "whoDisplayName"
            ? auditEvent.whoDisplayName
            : orderByProperty === "actionCategory"
            ? e.cast(e.str, auditEvent.actionCategory)
            : orderByProperty === "actionDescription"
            ? auditEvent.actionDescription
            : orderByProperty === "recordedDateTime"
            ? auditEvent.recordedDateTime
            : orderByProperty === "updatedDateTime"
            ? auditEvent.updatedDateTime
            : orderByProperty === "occurredDateTime"
            ? auditEvent.occurredDateTime
            : orderByProperty === "occurredDuration"
            ? auditEvent.occurredDuration
            : orderByProperty === "outcome"
            ? auditEvent.outcome
            : orderByProperty === "details"
            ? auditEvent.details
            : auditEvent.occurredDateTime,
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
