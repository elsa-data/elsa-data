import e from "../../../dbschema/edgeql-js";
import { RouteValidation } from "@umccr/elsa-types";
import * as interfaces from "../../../dbschema/interfaces";

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
    releaseKey: e.str,
  },
  (params) =>
    e.count(
      e.select(e.audit.ReleaseAuditEvent, (ae) => ({
        filter: e.op(ae.release_.releaseKey, "=", params.releaseKey),
      }))
    )
);

/**
 * Insert an audit event when a user is added to a release.
 */
export const addUserAuditEventToReleaseQuery = (
  whoId: string,
  whoDisplayName: string,
  role: string,
  releaseKey?: string
) => {
  return e.insert(e.audit.UserAuditEvent, {
    whoId,
    whoDisplayName,
    occurredDateTime: new Date(),
    actionCategory: "E",
    actionDescription:
      releaseKey !== undefined
        ? `Add user to release: ${releaseKey}`
        : "Add user to release",
    outcome: 0,
    details: e.json({ role: role }),
    inProgress: false,
  });
};

/**
 * Insert an audit event when a user's permission is changed.
 */
export const addUserAuditEventPermissionChange = (
  whoId: string,
  whoDisplayName: string,
  permission: Record<string, boolean>
) => {
  return e.insert(e.audit.UserAuditEvent, {
    whoId,
    whoDisplayName,
    occurredDateTime: new Date(),
    actionCategory: "E",
    actionDescription: `Change user permission`,
    outcome: 0,
    details: e.json(permission),
    inProgress: false,
  });
};
