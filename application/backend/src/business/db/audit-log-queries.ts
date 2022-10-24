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
    includeDetails: e.bool,
    start: e.int64,
    end: e.int64,
  },
  (params) =>
    e.select(e.audit.ReleaseAuditEvent, (auditEvent) => ({
      whoId: true,
      whoDisplayName: true,
      actionCategory: true,
      actionDescription: true,
      recordedDateTime: true,
      updatedDateTime: true,
      occurredDateTime: true,
      occurredDuration: true,
      outcome: true,
      detailsStr: e.op(
        e.to_str(auditEvent.details).slice(params.start, params.end),
        "if",
        params.includeDetails,
        "else",
        e.str("")
      ),
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
