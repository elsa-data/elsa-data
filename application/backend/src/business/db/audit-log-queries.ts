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
export const pageableAuditLogEntriesForReleaseQuery = e.params(
  {
    releaseId: e.uuid,
    limit: e.optional(e.int64),
    offset: e.optional(e.int64),
  },
  (params) =>
    e.select(e.audit.ReleaseAuditEvent, (ae) => ({
      ...e.audit.ReleaseAuditEvent["*"],
      filter: e.op(
        ae["<auditLog[is release::Release]"].id,
        "=",
        params.releaseId
      ),
      order_by: {
        expression: ae.occurredDateTime,
        direction: e.DESC,
      },
      limit: params.limit,
      offset: params.offset,
    }))
);

/**
 * A pageable EdgeDb query for the audit log entry details associated with
 * a given release.
 */
export const pageableAuditLogEntryDetailsForReleaseQuery = e.params(
  {
    releaseId: e.uuid,
    limit: e.optional(e.int64),
    offset: e.optional(e.int64),
    start: e.optional(e.int64),
    end: e.optional(e.int64)
  },
  (params) =>
    e.select(e.audit.ReleaseAuditEvent, auditEvent => ({
      detailsStr: e.to_str(auditEvent.details).slice(params.start, params.end),
      filter: e.op(
        auditEvent["<auditLog[is release::Release]"].id,
        "=",
        params.releaseId
      ),
      order_by: {
        expression: auditEvent.occurredDateTime,
        direction: e.DESC,
      },
      limit: params.limit,
      offset: params.offset,
    }))
);