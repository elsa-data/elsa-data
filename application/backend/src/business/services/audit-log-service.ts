import * as edgedb from "edgedb";
import { Executor } from "edgedb";
import e from "../../../dbschema/edgeql-js";
import { AuthenticatedUser } from "../authenticated-user";
import { inject, injectable } from "tsyringe";
import { UsersService } from "./users-service";
import { differenceInSeconds } from "date-fns";
import {
  AuditDataSummaryType,
  AuditDataAccessType,
  AuditEntryDetailsType,
  AuditEntryFullType,
  AuditEntryType,
} from "@umccr/elsa-types/schemas-audit";
import {
  createPagedResult,
  PagedResult,
} from "../../api/helpers/pagination-helpers";
import {
  auditLogDetailsForIdQuery,
  auditLogFullForIdQuery,
  countAuditLogEntriesForReleaseQuery,
  countDataAccessAuditLogEntriesQuery,
  pageableAuditLogEntriesForReleaseQuery,
  selectDataAccessAuditEventByReleaseIdQuery,
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
          releaseAuditLog: {
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
    releaseId,
    whoId,
    whoDisplayName,
    fileUrl,
    egressBytes,
    description,
    date,
  }: {
    executor: Executor;
    releaseId: string;
    whoId: string;
    whoDisplayName: string;
    fileUrl: string;
    description: string;
    egressBytes: number;
    date: Date;
  }) {
    const fileJson = await e
      .select(e.storage.File, (f) => ({
        ...f["*"],
        filter: e.op(f.url, "=", fileUrl),
      }))
      .assert_single()
      .run(executor);

    await e
      .update(e.release.Release, (r) => ({
        filter: e.op(r.id, "=", e.uuid(releaseId)),
        set: {
          dataAccessAuditLog: {
            "+=": e.insert(e.audit.DataAccessAuditEvent, {
              details: e.json(fileJson),
              egressBytes: egressBytes,
              whoId: whoId,
              whoDisplayName: whoDisplayName,
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

  public async getReleaseEntries(
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

  public async getDataAccessAuditByReleaseId(
    executor: Executor,
    user: AuthenticatedUser,
    releaseId: string,
    limit: number,
    offset: number,
    orderByProperty: string = "occurredDateTime",
    orderAscending: boolean = false
  ): Promise<PagedResult<AuditDataAccessType> | null> {
    const totalEntries = await countDataAccessAuditLogEntriesQuery.run(
      executor,
      { releaseId }
    );

    const dataAccessLogArray = await selectDataAccessAuditEventByReleaseIdQuery(
      releaseId,
      limit,
      offset,
      orderByProperty,
      orderAscending
    ).run(executor);

    return createPagedResult(
      dataAccessLogArray.map((entry) => ({
        objectId: entry.id,
        whoId: entry.whoId,
        whoDisplayName: entry.whoDisplayName,
        actionCategory: entry.actionCategory,
        actionDescription: entry.actionDescription,
        recordedDateTime: entry.recordedDateTime,
        updatedDateTime: entry.updatedDateTime,
        occurredDateTime: entry.occurredDateTime.toString(),
        occurredDuration: entry.occurredDuration?.toString(),
        outcome: entry.outcome,
        egressBytes: entry.egressBytes,
        fileUrl: entry.fileUrl as string,
        fileSize: entry.fileSize as number,
      })),
      totalEntries
    );
  }

  sortString(
    a: Record<string, string | number>,
    b: Record<string, string | number>,
    column: string
  ) {
    if (a[column] < b[column]) return -1;
    if (a[column] > b[column]) return 1;
    return 0;
  }

  public async getSummaryDataAccessAuditByReleaseId(
    executor: Executor,
    user: AuthenticatedUser,
    releaseId: string
  ): Promise<AuditDataSummaryType[] | null> {
    // TODO: Make this paginate

    const totalEntries = await countDataAccessAuditLogEntriesQuery.run(
      executor,
      { releaseId }
    );

    const dataAccessLogArray = await selectDataAccessAuditEventByReleaseIdQuery(
      releaseId,
      totalEntries,
      0,
      "occurredDateTime",
      false
    ).run(executor);

    if (!dataAccessLogArray) return null;

    // Grouping result by fileUrl
    const groupedByFileUrl = dataAccessLogArray.reduce((group: any, log) => {
      const fileUrl = log.fileUrl as string;

      group[fileUrl] = group[fileUrl] ?? [];
      group[fileUrl].push(log);
      return group;
    }, {});

    const dataAccessSummaryResult = [];
    for (const fileUrl in groupedByFileUrl) {
      const dataAccessEventArray = groupedByFileUrl[fileUrl];

      // Finding last event for that object
      // In some field we are only interested on the last event.
      const sortedEvent = dataAccessEventArray.sort((a: any, b: any) =>
        this.sortString(a, b, "occurredDateTime")
      );
      const lastEvent = sortedEvent.at(sortedEvent.length - 1);

      // Total egress (in bytes)
      let totalEgressBytes: number = 0;
      for (const log of dataAccessEventArray) {
        const { egressBytes } = log;
        totalEgressBytes += egressBytes;
      }

      // Calculate status of download. Rough indicate if download was complete, incomplete, multi-download
      let downloadStatus: string;
      const { fileSize } = lastEvent; // All other should value should be the same
      if (totalEgressBytes == fileSize) {
        downloadStatus = "complete";
      } else if (totalEgressBytes < fileSize) {
        downloadStatus = "incomplete";
      } else if (totalEgressBytes > fileSize) {
        downloadStatus = "multiple-download";
      } else {
        downloadStatus = "-";
      }

      dataAccessSummaryResult.push({
        target: lastEvent.whoDisplayName,
        fileUrl: fileUrl,
        fileSize: fileSize,
        dataAccessedInBytes: totalEgressBytes,
        downloadStatus: downloadStatus,
        lastAccessedTime: lastEvent.occurredDateTime,
      });
    }

    return dataAccessSummaryResult;
  }
}
