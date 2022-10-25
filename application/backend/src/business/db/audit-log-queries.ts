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
    whoId: includeNonDetails,
    whoDisplayName: includeNonDetails,
    actionCategory: includeNonDetails,
    actionDescription: includeNonDetails,
    recordedDateTime: includeNonDetails,
    updatedDateTime: includeNonDetails,
    occurredDateTime: includeNonDetails,
    occurredDuration: includeNonDetails,
    outcome: includeNonDetails,
    detailsStr: includeDetails
      ? e.to_str(auditEvent.details).slice(start, end)
      : undefined,
    filter: e.op(
      auditEvent["<auditLog[is release::Release]"].id,
      "=",
      e.uuid(releaseId)
    ),
    order_by: {
      expression: auditEvent.occurredDateTime,
      direction: e.DESC,
    },
    limit: limit,
    offset: offset,
  }));
};
