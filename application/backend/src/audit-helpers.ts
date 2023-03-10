import {
  AuditLogService,
  OUTCOME_SERIOUS_FAILURE,
  OUTCOME_SUCCESS,
} from "./business/services/audit-log-service";
import { Client, Executor } from "edgedb";
import { AuthenticatedUser } from "./business/authenticated-user";
import { Transaction } from "edgedb/dist/transaction";
import { audit } from "../dbschema/interfaces";

/**
 * The transaction audit pattern for releases executes the three
 * given functions in a chain, but interspersed with audit
 * start/success/failure functionality.
 *
 * @param auditLogService the audit service able to create audit events
 * @param edgeDbClient the edge db client from which transactions will be launched
 * @param user the user performing the action
 * @param releaseKey the release key the action is occurring in the context of
 * @param actionCategory the category of audit action
 * @param actionDescription the static action description
 * @param initFunc
 * @param transFunc
 * @param finishFunc
 */
export async function transactionalAuditPattern<T, U, V>(
  auditLogService: AuditLogService,
  edgeDbClient: Client,
  user: AuthenticatedUser,
  releaseKey: string,
  actionCategory: audit.ActionType,
  actionDescription: string,
  initFunc: () => Promise<T>,
  transFunc: (tx: Transaction, a: T) => Promise<U>,
  finishFunc: (a: U) => Promise<V>
) {
  const auditEventStart = new Date();
  const auditEventId = await auditLogService.startReleaseAuditEvent(
    edgeDbClient,
    user,
    releaseKey,
    actionCategory,
    actionDescription,
    auditEventStart
  );

  try {
    const initBlockResult = await initFunc();

    const transResult = await edgeDbClient.transaction(async (tx) => {
      const transBlockResult = await transFunc(tx, initBlockResult);

      await auditLogService.completeReleaseAuditEvent(
        tx,
        auditEventId,
        OUTCOME_SUCCESS,
        auditEventStart,
        new Date(),
        // need to consider whether we always audit details the whole transaction
        // function return value - or if we need to split this  [auditDetail, transactionResult]
        transBlockResult
      );

      return transBlockResult;
    });

    return await finishFunc(transResult);
  } catch (error) {
    // TODO possibly better breakdown of the details of the error
    const errorString = error instanceof Error ? error.message : String(error);

    await auditLogService.completeReleaseAuditEvent(
      edgeDbClient,
      auditEventId,
      OUTCOME_SERIOUS_FAILURE,
      auditEventStart,
      new Date(),
      { error: errorString }
    );

    throw error;
  }
}

async function auditReleaseGenericStart(
  service: AuditLogService,
  executor: Executor,
  user: AuthenticatedUser,
  releaseKey: string,
  actionCategory: string,
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
  return auditReleaseGenericStart(
    service,
    executor,
    user,
    releaseKey,
    "U",
    actionDescription
  );
}

/**
 * Helper function to start an audit event in the context of a release
 * for an EXECUTE operation.
 *
 * @param service
 * @param executor
 * @param user
 * @param releaseKey
 * @param actionDescription
 */
export async function auditReleaseExecuteStart(
  service: AuditLogService,
  executor: Executor,
  user: AuthenticatedUser,
  releaseKey: string,
  actionDescription: string
) {
  return auditReleaseGenericStart(
    service,
    executor,
    user,
    releaseKey,
    "E",
    actionDescription
  );
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

export async function auditSuccess(
  service: AuditLogService,
  executor: Executor,
  auditEventId: string,
  startTime: Date,
  details?: any
) {
  await service.completeReleaseAuditEvent(
    executor,
    auditEventId,
    OUTCOME_SUCCESS,
    startTime,
    new Date(),
    details
  );
}
