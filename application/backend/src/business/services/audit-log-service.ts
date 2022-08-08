import * as edgedb from "edgedb";
import e from "../../../dbschema/edgeql-js";
import { AuthenticatedUser } from "../authenticated-user";
import { inject, injectable } from "tsyringe";
import { UsersService } from "./users-service";
import { differenceInSeconds } from "date-fns";
import { AuditEntryType } from "@umccr/elsa-types/schemas-audit";
import { createPagedResult, PagedResult } from "../../api/api-pagination";
import {
  countAuditLogEntriesForReleaseQuery,
  pageableAuditLogEntriesForReleaseQuery,
} from "../db/audit-log-queries";

export type AuditEventAction = "C" | "R" | "U" | "D" | "E";
export type AuditEventOutcome = 0 | 4 | 8 | 12;

@injectable()
export class AuditLogService {
  private readonly MIN_AUDIT_LENGTH_FOR_DURATION_SECONDS = 10;

  constructor(
    @inject("Database") private edgeDbClient: edgedb.Client,
    private usersService: UsersService
  ) {}

  /**
   * Start the entry for an audit event that occurs in a release context.
   *
   * @param user
   * @param releaseId
   * @param actionCategory
   * @param actionDescription
   * @param start
   */
  public async startReleaseAuditEvent(
    user: AuthenticatedUser,
    releaseId: string,
    actionCategory: AuditEventAction,
    actionDescription: string,
    start: Date
  ): Promise<string> {
    const auditEvent = await e
      .insert(e.audit.AuditEvent, {
        whoId: user.subjectId,
        whoDisplayName: user.displayName,
        occurredDateTime: start,
        actionCategory: actionCategory,
        actionDescription: actionDescription,
        // by default, we assume failure (i.e. 500 response) - it is only when
        // we successfully 'complete' the audit event we get a real outcome
        outcome: 8,
        details: e.json({
          errorMessage: "Audit entry not completed",
        }),
      })
      .run(this.edgeDbClient);

    // TODO: get the insert AND the update to happen at the same time (easy) - but ALSO get it to return
    // the id of the newly inserted event (instead we can only get the release id)
    const updatedRelease = await e
      .update(e.release.Release, (r) => ({
        filter: e.op(e.uuid(releaseId), "=", r.id),
        set: {
          auditLog: {
            "+=": e.select(e.audit.AuditEvent, (ae) => ({
              filter: e.op(e.uuid(auditEvent.id), "=", ae.id).assert_single(),
            })),
          },
        },
      }))
      .run(this.edgeDbClient);

    return auditEvent.id;
  }

  /**
   * Complete the entry for an audit event that occurs in a release context.
   *
   * @param auditEventId
   * @param outcome
   * @param start
   * @param end
   * @param details
   */
  public async completeReleaseAuditEvent(
    auditEventId: string,
    outcome: AuditEventOutcome,
    start: Date,
    end: Date,
    details: any
  ): Promise<void> {
    const diffSeconds = differenceInSeconds(end, start);
    const diffDuration = new edgedb.Duration(0, 0, 0, 0, 0, 0, diffSeconds);

    const ae = await e
      .update(e.audit.AuditEvent, (ae) => ({
        filter: e.op(e.uuid(auditEventId), "=", ae.id),
        set: {
          outcome: outcome,
          details: e.json(details),
          occurredDuration:
            diffSeconds > this.MIN_AUDIT_LENGTH_FOR_DURATION_SECONDS
              ? e.duration(diffDuration)
              : null,
          updatedDateTime: e.datetime_current(),
        },
      }))
      .run(this.edgeDbClient);
  }

  public async getEntries(
    user: AuthenticatedUser,
    releaseId: string,
    limit: number,
    offset: number
  ): Promise<PagedResult<AuditEntryType>> {
    const totalEntries = await countAuditLogEntriesForReleaseQuery.run(
      this.edgeDbClient,
      { releaseId: releaseId }
    );

    const pageOfEntries = await pageableAuditLogEntriesForReleaseQuery.run(
      this.edgeDbClient,
      { releaseId: releaseId, limit: limit, offset: offset }
    );

    return createPagedResult(
      pageOfEntries.map((a) => ({
        whoDisplay: a.whoDisplayName,
        when: a.occurredDateTime,
        actionCategory: a.actionCategory,
        actionDescription: a.actionDescription,
        duration: a.occurredDuration
          ? a.occurredDuration.toString()
          : undefined,
      })),
      totalEntries,
      limit
    );
  }
}
