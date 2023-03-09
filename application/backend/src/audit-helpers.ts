import {
  AuditLogService,
  OUTCOME_SERIOUS_FAILURE,
} from "./business/services/audit-log-service";
import { Executor } from "edgedb";
import { AuthenticatedUser } from "./business/authenticated-user";

/**
 * Helper function to start an audit event in the context of a release
 * for an UPDATE operation.
 *
 * @param service
 * @param executor
 * @param user
 * @param releaseKey
 * @param actionDescription
 */
export async function auditReleaseUpdateStart(
  service: AuditLogService,
  executor: Executor,
  user: AuthenticatedUser,
  releaseKey: string,
  actionDescription: string
) {
  const now = new Date();
  const newAuditEventId = await service.startReleaseAuditEvent(
    executor,
    user,
    releaseKey,
    "U",
    actionDescription,
    now
  );

  return {
    auditEventId: newAuditEventId,
    auditEventStart: now,
  };
}

/**
 * Helper function to complete an audit event by indicating an
 * exception has lead to failure.
 *
 * @param service
 * @param executor
 * @param auditEventId
 * @param startTime
 * @param error
 */
export async function auditFailure(
  service: AuditLogService,
  executor: Executor,
  auditEventId: string,
  startTime: Date,
  error: unknown
) {
  const errorString = error instanceof Error ? error.message : String(error);

  await service.completeReleaseAuditEvent(
    executor,
    auditEventId,
    OUTCOME_SERIOUS_FAILURE,
    startTime,
    new Date(),
    { error: errorString }
  );
}
