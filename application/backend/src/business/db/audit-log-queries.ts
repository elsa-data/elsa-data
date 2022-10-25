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
 * Base shape for an audit log entry query.
 */
export const auditLogEntryQueryShape = (
  includeNonDetails: boolean = true,
  includeDetails: boolean = false,
  start: number = 0,
  end: number = -1
) => {
  return e.shape(e.audit.ReleaseAuditEvent, (auditEvent) => ({
    whoId: includeNonDetails,
    whoDisplayName: includeNonDetails,
    actionCategory: includeNonDetails,
    actionDescription: includeNonDetails,
    recordedDateTime: includeNonDetails,
    updatedDateTime: includeNonDetails,
    occurredDateTime: includeNonDetails,
    occurredDuration: includeNonDetails,
    outcome: includeNonDetails,
    detailsStr: <string | null>(
      (includeDetails ? e.to_str(auditEvent.details).slice(start, end) : null)
    ),
    order_by: {
      expression: auditEvent.occurredDateTime,
      direction: e.DESC,
    },
  }));
};

/**
 * A pageable EdgeDb query for the audit log entries associated with
 * a given release.
 */
export const pageableAuditLogEntriesForReleaseQuery = (
  releaseId: string,
  includeNonDetails: boolean = true,
  includeDetails: boolean = false,
  start: number = 0,
  end: number = -1,
  limit?: number,
  offset?: number
) => {
  return e.select(e.audit.ReleaseAuditEvent, (auditEvent) => ({
    ...auditLogEntryQueryShape(
      includeNonDetails,
      includeDetails,
      start,
      end
    )(auditEvent),
    filter: e.op(
      auditEvent["<auditLog[is release::Release]"].id,
      "=",
      e.uuid(releaseId)
    ),
    limit: limit,
    offset: offset,
  }));
};
