import * as edgedb from "edgedb";
import { Executor } from "edgedb";
import e from "../../../dbschema/edgeql-js";
import { AuthenticatedUser } from "../authenticated-user";
import { inject, injectable } from "tsyringe";
import { differenceInSeconds } from "date-fns";
import {
  AuditDataSummaryType,
  AuditDataAccessType,
  AuditEventDetailsType,
  AuditEventFullType,
  AuditEventType,
  RouteValidation,
} from "@umccr/elsa-types/schemas-audit";
import {
  createPagedResult,
  PagedResult,
} from "../../api/helpers/pagination-helpers";
import {
  auditLogDetailsForIdQuery,
  auditLogFullForIdQuery,
  countAuditLogEntriesForReleaseQuery,
  countAuditLogEntriesForSystemQuery,
  countDataAccessAuditLogEntriesQuery,
  pageableAuditEventsQuery,
  pageableAuditLogEntriesForReleaseQuery,
  pageableAuditLogEntriesForSystemQuery,
  selectDataAccessAuditEventByReleaseKeyQuery,
} from "../db/audit-log-queries";
import { ElsaSettings } from "../../config/elsa-settings";
import { touchRelease } from "../db/release-queries";
import { audit } from "../../../dbschema/interfaces";
import DataAccessAuditEvent = audit.DataAccessAuditEvent;
import AuditEvent = audit.AuditEvent;
import ActionType = audit.ActionType;
import AuditEventUserFilterType = RouteValidation.AuditEventUserFilterType;
import {
  getReleaseKeyFromReleaseAuditEvent,
  insertReleaseAuditEvent,
  insertSystemAuditEvent,
  insertUserAuditEvent,
  releaseGetBoundaryInfo,
} from "../../../dbschema/queries";
import { NotAuthorisedViewAudits } from "../exceptions/audit-authorisation";

export const OUTCOME_SUCCESS = 0;
export const OUTCOME_MINOR_FAILURE = 4;
export const OUTCOME_SERIOUS_FAILURE = 8;
export const OUTCOME_MAJOR_FAILURE = 12;

// Code	Display	Definition
// 0	Success	The operation completed successfully (whether with warnings or not).
// 4	Minor failure	The action was not successful due to some kind of minor failure (often equivalent to an HTTP 400 response).
// 8	Serious failure	The action was not successful due to some kind of unexpected error (often equivalent to an HTTP 500 response).
// 12	Major failure	An error of such magnitude occurred that the system is no longer available for use (i.e. the system died).

export type AuditEventAction = "C" | "R" | "U" | "D" | "E";
export type AuditEventOutcome = 0 | 4 | 8 | 12;

@injectable()
export class AuditLogService {
  private readonly MIN_AUDIT_LENGTH_FOR_DURATION_SECONDS = 10;

  constructor(
    @inject("Settings") private settings: ElsaSettings // NOTE: we don't define an edgeDbClient here as the audit log functionality // is designed to work either standalone or in a transaction context
  ) {}

  /**
   *
   * @param executor the EdgeDb execution context (either client or transaction)
   * @param user
   * @param releaseKey
   * @returns
   */
  private async checkIsAllowedViewAuditEvents(
    executor: Executor,
    user: AuthenticatedUser,
    releaseKey?: string
  ): Promise<void> {
    // Check if user has the permission to view all audit events
    const isPermissionAllow = user.isAllowedViewAllAuditEvents;
    if (isPermissionAllow) return;

    // Check if user is part of release therefore have access
    if (releaseKey) {
      const userReleaseRole = (
        await releaseGetBoundaryInfo(executor, {
          userDbId: user.dbId,
          releaseKey: releaseKey,
        })
      )?.role?.["@role"];
      if (userReleaseRole) return;
    }

    throw new NotAuthorisedViewAudits(releaseKey);
  }

  /**
   * Start the entry for an audit event that occurs in a release context.
   *
   * @param executor the EdgeDb execution context (either client or transaction)
   * @param user
   * @param releaseKey
   * @param actionCategory
   * @param actionDescription
   * @param start
   */
  public async startReleaseAuditEvent(
    executor: Executor,
    user: AuthenticatedUser,
    releaseKey: string,
    actionCategory: ActionType,
    actionDescription: string,
    start: Date = new Date()
  ): Promise<string> {
    const auditEvent = await insertReleaseAuditEvent(executor, {
      whoId: user.subjectId,
      whoDisplayName: user.displayName,
      occurredDateTime: start,
      actionCategory: actionCategory,
      actionDescription: actionDescription,
      outcome: 8,
      details: e.json({
        errorMessage: "Audit entry not completed",
      }),
    });

    // TODO: get the insert AND the update to happen at the same time (easy) - but ALSO get it to return
    // the id of the newly inserted event (instead we can only get the release id)
    await e
      .update(e.release.Release, (r) => ({
        filter: e.op(releaseKey, "=", r.releaseKey),
        set: {
          releaseAuditLog: {
            "+=": e.select(e.audit.ReleaseAuditEvent, (ae) => ({
              filter: e.op(e.uuid(auditEvent.id), "=", ae.id).assert_single(),
            })),
          },
        },
      }))
      .run(executor);

    await touchRelease.run(executor, { releaseKey: releaseKey });

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
    details?: any
  ): Promise<void> {
    const diffSeconds = differenceInSeconds(end, start);
    const diffDuration = new edgedb.Duration(0, 0, 0, 0, 0, 0, diffSeconds);
    await e
      .update(e.audit.ReleaseAuditEvent, (ae) => ({
        filter: e.op(e.uuid(auditEventId), "=", ae.id),
        set: {
          outcome: outcome,
          details: details ? e.json(details) : e.json({}),
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
   * Start the entry for an audit event that occurs in a user context.
   *
   * @param executor the EdgeDb execution context (either client or transaction)
   * @param whoId
   * @param whoDisplayName
   * @param userId
   * @param actionCategory
   * @param actionDescription
   * @param start
   */
  public async startUserAuditEvent(
    executor: Executor,
    whoId: string,
    whoDisplayName: string,
    userId: string,
    actionCategory: ActionType,
    actionDescription: string,
    start: Date = new Date()
  ): Promise<string> {
    const auditEvent = await insertUserAuditEvent(executor, {
      whoId,
      whoDisplayName,
      actionCategory,
      actionDescription,
      occurredDateTime: start,
      outcome: 8,
      details: { errorMessage: "Audit entry not completed" },
    });

    // TODO: get the insert AND the update to happen at the same time (easy) - but ALSO get it to return
    // the id of the newly inserted event (instead we can only get the release id)
    await this.updateUser(userId, auditEvent, executor);

    return auditEvent.id;
  }

  private async updateUser(
    userId: string,
    auditEvent: { id: string },
    executor: Executor
  ) {
    await e
      .update(e.permission.User, (user) => ({
        filter: e.op(e.uuid(userId), "=", user.id),
        set: {
          userAuditEvent: {
            "+=": e.select(e.audit.UserAuditEvent, (ae) => ({
              filter: e.op(e.uuid(auditEvent.id), "=", ae.id).assert_single(),
            })),
          },
        },
      }))
      .run(executor);
  }

  /**
   * Create a UserAuditEvent in one go.
   *
   * @param executor the EdgeDb execution context (either client or transaction)
   * @param whoId
   * @param whoDisplayName
   * @param userId
   * @param actionCategory
   * @param actionDescription
   * @param occurredDateTime
   * @param outcome
   * @param details
   */
  public async createUserAuditEvent(
    executor: Executor,
    userId: string,
    whoId: string,
    whoDisplayName: string,
    actionCategory: ActionType,
    actionDescription: string,
    details?: any,
    outcome: number = 0,
    occurredDateTime: Date = new Date()
  ): Promise<string> {
    const auditEvent = await insertUserAuditEvent(executor, {
      whoId,
      whoDisplayName,
      actionCategory,
      actionDescription,
      occurredDateTime,
      outcome,
      details,
    });

    await this.updateUser(userId, auditEvent, executor);

    return auditEvent.id;
  }

  /**
   * Complete the entry for an audit event that occurs in a user context.
   *
   * @param executor the EdgeDb execution context (either client or transaction)
   * @param auditEventId
   * @param outcome
   * @param start
   * @param end
   * @param details
   */
  public async completeUserAuditEvent(
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
      .update(e.audit.UserAuditEvent, (ae) => ({
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
   * Start the entry for a system audit event.
   *
   * @param executor the EdgeDb execution context (either client or transaction)
   * @param actionCategory
   * @param actionDescription
   * @param start
   */
  public async startSystemAuditEvent(
    executor: Executor,
    actionCategory: ActionType,
    actionDescription: string,
    start: Date = new Date()
  ): Promise<string> {
    return (
      await insertSystemAuditEvent(executor, {
        actionCategory,
        actionDescription,
        occurredDateTime: start,
        outcome: 8,
        details: { errorMessage: "Audit entry not completed" },
      })
    ).id;
  }

  /**
   * Create a system audit event in one go.
   *
   * @param executor the EdgeDb execution context (either client or transaction)
   * @param actionCategory
   * @param actionDescription
   * @param outcome
   * @param details
   */
  public async createSystemAuditEvent(
    executor: Executor,
    actionCategory: ActionType,
    actionDescription: string,
    details?: any,
    outcome: number = 0
  ): Promise<string> {
    return (
      await insertSystemAuditEvent(executor, {
        actionCategory,
        actionDescription,
        outcome,
        details,
      })
    ).id;
  }

  /**
   * Complete the entry for a system audit event.
   *
   * @param executor the EdgeDb execution context (either client or transaction)
   * @param auditEventId
   * @param outcome
   * @param start
   * @param end
   * @param details
   */
  public async completeSystemAuditEvent(
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
      .update(e.audit.SystemAuditEvent, (ae) => ({
        filter: e.op(e.uuid(auditEventId), "=", ae.id),
        set: {
          outcome: outcome,
          details: details ? e.json(details) : e.json({}),
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
    releaseKey,
    whoId,
    whoDisplayName,
    fileUrl,
    egressBytes,
    description,
    date,
  }: {
    executor: Executor;
    releaseKey: string;
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
        filter: e.op(r.releaseKey, "=", releaseKey),
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

    await touchRelease.run(executor, { releaseKey: releaseKey });
  }

  public async getReleaseEntries(
    executor: Executor,
    user: AuthenticatedUser,
    releaseKey: string,
    limit: number,
    offset: number,
    orderByProperty: keyof AuditEvent = "occurredDateTime",
    orderAscending: boolean = false
  ): Promise<PagedResult<AuditEventType> | null> {
    await this.checkIsAllowedViewAuditEvents(executor, user, releaseKey);

    const totalEntries = await countAuditLogEntriesForReleaseQuery.run(
      executor,
      { releaseKey }
    );

    const pageOfEntries = await pageableAuditLogEntriesForReleaseQuery(
      releaseKey,
      limit,
      offset,
      orderByProperty,
      orderAscending
    ).run(executor);

    console.log(
      `${AuditLogService.name}.getEntries(releaseKey=${releaseKey}, limit=${limit}, offset=${offset}) -> total=${totalEntries}, pageOfEntries=...`
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

  /**
   * Get User audit entries, filtering the result to include system or release entries, or to include all
   * users' events.
   *
   * @param executor
   * @param filter
   * @param user
   * @param limit
   * @param offset
   * @param includeSystemEvents
   * @param orderByProperty
   * @param orderAscending
   */
  public async getUserEntries(
    executor: Executor,
    filter: AuditEventUserFilterType[],
    user: AuthenticatedUser,
    limit: number,
    offset: number,
    includeSystemEvents: boolean = false,
    orderByProperty: keyof AuditEvent = "occurredDateTime",
    orderAscending: boolean = false
  ): Promise<PagedResult<AuditEventType> | null> {
    // These query filters require special permission.
    if (filter.includes("all") || filter.includes("system")) {
      await this.checkIsAllowedViewAuditEvents(executor, user);
    }

    const { count, entries } = pageableAuditEventsQuery(
      filter.filter((value) => value !== "all"),
      filter.includes("all") ? "all" : [user.dbId],
      limit,
      offset,
      true,
      orderByProperty,
      orderAscending
    );

    const length = await count.run(executor);
    console.log(
      `${AuditLogService.name}.getEntries(user=${user}, limit=${limit}, offset=${offset}) -> total=${length}, pageOfEntries=...`
    );

    return createPagedResult(
      (await entries.run(executor)).map((entry: any) => ({
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
      length
    );
  }

  public async getSystemEntries(
    executor: Executor,
    limit: number,
    offset: number,
    orderByProperty: keyof AuditEvent = "occurredDateTime",
    orderAscending: boolean = false
  ): Promise<PagedResult<AuditEventType> | null> {
    const totalEntries = await countAuditLogEntriesForSystemQuery.run(executor);

    const pageOfEntries = await pageableAuditLogEntriesForSystemQuery(
      limit,
      offset,
      true,
      true,
      orderByProperty,
      orderAscending
    ).run(executor);

    console.log(
      `${AuditLogService.name}.getEntries(limit=${limit}, offset=${offset}) -> total=${totalEntries}, pageOfEntries=...`
    );

    return createPagedResult(
      pageOfEntries.map((entry) => ({
        objectId: entry.id,
        whoId: null,
        whoDisplayName: null,
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
  ): Promise<AuditEventDetailsType | null> {
    // Find if "releaseKey" exist associated with this Id.
    const rKey = (
      await getReleaseKeyFromReleaseAuditEvent(executor, {
        releaseAuditEventId: id,
      })
    )?.releaseKey;

    await this.checkIsAllowedViewAuditEvents(executor, user, rKey);

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
  ): Promise<AuditEventFullType | null> {
    await this.checkIsAllowedViewAuditEvents(executor, user);

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

  public async getDataAccessAuditByReleaseKey(
    executor: Executor,
    user: AuthenticatedUser,
    releaseKey: string,
    limit: number,
    offset: number,
    orderByProperty:
      | keyof DataAccessAuditEvent
      | "fileUrl"
      | "fileSize" = "occurredDateTime",
    orderAscending: boolean = false
  ): Promise<PagedResult<AuditDataAccessType> | null> {
    await this.checkIsAllowedViewAuditEvents(executor, user, releaseKey);

    const totalEntries = await countDataAccessAuditLogEntriesQuery.run(
      executor,
      { releaseKey }
    );

    const dataAccessLogArray =
      await selectDataAccessAuditEventByReleaseKeyQuery(
        releaseKey,
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

  public async getSummaryDataAccessAuditByReleaseKey(
    executor: Executor,
    user: AuthenticatedUser,
    releaseKey: string
  ): Promise<AuditDataSummaryType[] | null> {
    await this.checkIsAllowedViewAuditEvents(executor, user, releaseKey);

    // TODO: Make this paginate
    const totalEntries = await countDataAccessAuditLogEntriesQuery.run(
      executor,
      { releaseKey }
    );

    const dataAccessLogArray =
      await selectDataAccessAuditEventByReleaseKeyQuery(
        releaseKey,
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

  /**
   * Add a sync dataset user audit event.
   */
  public async insertSyncDatasetAuditEvent(
    executor: Executor,
    user: AuthenticatedUser,
    dataset: string,
    occurredDateTime: Date
  ) {
    return await this.createUserAuditEvent(
      executor,
      user.dbId,
      user.subjectId,
      user.displayName,
      "U",
      `Sync dataset: ${dataset}`,
      null,
      0,
      occurredDateTime
    );
  }

  /**
   * Add audit event when database is added.
   */
  public async insertAddDatasetAuditEvent(
    executor: Executor,
    user: AuthenticatedUser,
    dataset: string
  ) {
    return await this.createUserAuditEvent(
      executor,
      user.dbId,
      user.subjectId,
      user.displayName,
      "C",
      `Add dataset: ${dataset}`
    );
  }

  /**
   * Add audit event when dataset is deleted.
   */
  public async insertDeleteDatasetAuditEvent(
    executor: Executor,
    user: AuthenticatedUser,
    dataset: string
  ) {
    return await this.createUserAuditEvent(
      executor,
      user.dbId,
      user.subjectId,
      user.displayName,
      "D",
      `Delete dataset: ${dataset}`
    );
  }
}
