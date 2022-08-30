import e from "../../../dbschema/edgeql-js";

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
      e.select(e.audit.AuditEvent, (ae) => ({
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
    e.select(e.audit.AuditEvent, (ae) => ({
      ...e.audit.AuditEvent["*"],
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
