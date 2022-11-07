import * as edgedb from "edgedb";
import { Executor } from "edgedb";
import e from "../../../dbschema/edgeql-js";
import { AuthenticatedUser } from "../authenticated-user";
import { inject, injectable } from "tsyringe";
import { UsersService } from "./users-service";
import { differenceInSeconds } from "date-fns";
import {
  AuditEntryDetailsType,
  AuditEntryFullType,
  AuditEntryType,
} from "@umccr/elsa-types/schemas-audit";
import { createPagedResult, PagedResult } from "../../api/api-pagination";
import {
  auditLogDetailsForIdQuery,
  auditLogFullForIdQuery,
  countAuditLogEntriesForReleaseQuery,
  pageableAuditLogEntriesForReleaseQuery,
} from "../db/audit-log-queries";
import { ElsaSettings } from "../../config/elsa-settings";

export type AuditEventAction = "C" | "R" | "U" | "D" | "E";
export type AuditEventOutcome = 0 | 4 | 8 | 12;

@injectable()
export class AuditLogService {
  private readonly MIN_AUDIT_LENGTH_FOR_DURATION_SECONDS = 10;

  constructor(
    @inject("Settings") private settings: ElsaSettings,
    // NOTE: we don't define an edgeDbClient here as the audit log functionality
    // is designed to work either standalone or in a transaction context
    private _usersService: UsersService
  ) {}

  /**
   * Start the entry for an audit event that occurs in a release context.
   *
   * @param executor the EdgeDb execution context (either client or transaction)
   * @param user
   * @param releaseId
   * @param actionCategory
   * @param actionDescription
   * @param start
   */
  public async startReleaseAuditEvent(
    executor: Executor,
    user: AuthenticatedUser,
    releaseId: string,
    actionCategory: AuditEventAction,
    actionDescription: string,
    start: Date
  ): Promise<string> {
    const auditEvent = await e
      .insert(e.audit.ReleaseAuditEvent, {
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
      .run(executor);

    // TODO: get the insert AND the update to happen at the same time (easy) - but ALSO get it to return
    // the id of the newly inserted event (instead we can only get the release id)
    await e
      .update(e.release.Release, (r) => ({
        filter: e.op(e.uuid(releaseId), "=", r.id),
        set: {
          auditLog: {
            "+=": e.select(e.audit.ReleaseAuditEvent, (ae) => ({
              filter: e.op(e.uuid(auditEvent.id), "=", ae.id).assert_single(),
            })),
          },
        },
      }))
      .run(executor);

    return auditEvent.id;
  }

  /**
   * Complete the entry for an audit event that occurs in a release context.
   *
   * @param executor the EdgeDb execution context (either client or transaction)
   * @param auditEventId
   * @param outcome
   * @param start
   * @param end
   * @param details
   */
  public async completeReleaseAuditEvent(
    executor: Executor,
    auditEventId: string,
    outcome: AuditEventOutcome,
    start: Date,
    end: Date,
    details: any
  ): Promise<void> {
    const diffSeconds = differenceInSeconds(end, start);
    const diffDuration = new edgedb.Duration(0, 0, 0, 0, 0, 0, diffSeconds);
    await e
      .update(e.audit.ReleaseAuditEvent, (ae) => ({
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
      .run(executor);
  }

  /**
   * Insert DataAccessAudit
   */
  public async updateDataAccessAuditEvent({
    executor,
    releaseAuditEventId,
    who,
    fileUrl,
    egressBytes,
    description,
    date,
  }: {
    executor: Executor;
    releaseAuditEventId: string;
    who: string;
    fileUrl: string;
    description: string;
    egressBytes: number;
    date: Date;
  }) {
    await e
      .update(e.audit.ReleaseAuditEvent, (ra) => ({
        filter: e.op(ra.id, "=", e.uuid(releaseAuditEventId)),
        set: {
          dataAccessAuditEvents: {
            "+=": e.insert(e.audit.DataAccessAuditEvent, {
              file: e
                .select(e.storage.File, (f) => ({
                  filter: e.op(f.url, "=", fileUrl),
                }))
                .assert_single(),
              egressBytes: egressBytes,
              whoId: who,
              whoDisplayName: who,
              actionCategory: e.audit.ActionType.R,
              actionDescription: description,
              occurredDateTime: e.datetime(date),
              outcome: 0,
            }),
          },
        },
      }))
      .run(executor);
  }

  public async getEntries(
    executor: Executor,
    user: AuthenticatedUser,
    releaseId: string,
    limit: number,
    offset: number,
    orderByProperty: string = "occurredDateTime",
    orderAscending: boolean = false
  ): Promise<PagedResult<AuditEntryType> | null> {
    const totalEntries = await countAuditLogEntriesForReleaseQuery.run(
      executor,
      { releaseId }
    );

    const pageOfEntries = await pageableAuditLogEntriesForReleaseQuery(
      releaseId,
      limit,
      offset,
      orderByProperty,
      orderAscending
    ).run(executor);

    console.log(
      `${AuditLogService.name}.getEntries(releaseId=${releaseId}, limit=${limit}, offset=${offset}) -> total=${totalEntries}, pageOfEntries=...`
    );

    return createPagedResult(
      pageOfEntries.map((entry) => ({
        objectId: entry.id,
        whoId: entry.whoId,
        whoDisplayName: entry.whoDisplayName,
        actionCategory: entry.actionCategory,
        actionDescription: entry.actionDescription,
        recordedDateTime: entry.recordedDateTime,
        updatedDateTime: entry.updatedDateTime,
        occurredDateTime: entry.occurredDateTime,
        occurredDuration: entry.occurredDuration?.toString(),
        outcome: entry.outcome,
        hasDetails: entry.hasDetails,
      })),
      totalEntries
    );
  }

  public async getEntryDetails(
    executor: Executor,
    user: AuthenticatedUser,
    id: string,
    start: number,
    end: number
  ): Promise<AuditEntryDetailsType | null> {
    const entry = await auditLogDetailsForIdQuery(id, start, end).run(executor);

    if (!entry) {
      return null;
    } else {
      return {
        objectId: entry.id,
        details: entry.detailsStr ?? undefined,
        truncated: entry.truncated,
      };
    }
  }

  public async getFullEntry(
    executor: Executor,
    user: AuthenticatedUser,
    id: string
  ): Promise<AuditEntryFullType | null> {
    const entry = await auditLogFullForIdQuery(id).run(executor);

    if (!entry) {
      return null;
    } else {
      return {
        objectId: entry.id,
        whoId: entry.whoId,
        whoDisplayName: entry.whoDisplayName,
        actionCategory: entry.actionCategory,
        actionDescription: entry.actionDescription,
        recordedDateTime: entry.recordedDateTime,
        updatedDateTime: entry.updatedDateTime,
        occurredDateTime: entry.occurredDateTime,
        occurredDuration: entry.occurredDuration?.toString(),
        outcome: entry.outcome,
        details: entry.details,
      };
    }
  }
}
