import * as edgedb from "edgedb";
import { Executor } from "edgedb";
import e from "../../../dbschema/edgeql-js";
import { AuthenticatedUser } from "../authenticated-user";
import { inject, injectable } from "tsyringe";
import { differenceInSeconds, sub } from "date-fns";
import {
  AuditEventDetailsType,
  AuditEventFullType,
  AuditEventType,
  RouteValidation,
} from "@umccr/elsa-types/schemas-audit";
import {
  createPagedResult,
  PagedResult,
} from "../../api/helpers/pagination-helpers";
import { ElsaSettings } from "../../config/elsa-settings";
import * as interfaces from "../../../dbschema/interfaces";
import {
  auditEventGetMostRecent,
  auditEventGetSomeByUser,
  insertReleaseAuditEvent,
  insertSystemAuditEvent,
  insertUserAuditEvent,
  releaseGetBoundaryInfo,
  releaseLastUpdatedReset,
  updateUserAuditEvents,
} from "../../../dbschema/queries";
import { NotAuthorisedViewAudits } from "../exceptions/audit-authorisation";
import { Transaction } from "edgedb/dist/transaction";
import { Logger } from "pino";
import { UserData } from "../data/user-data";
import AuditEvent = interfaces.audit.AuditEvent;
import ActionType = interfaces.audit.ActionType;

export const OUTCOME_SUCCESS = 0;
export const OUTCOME_MINOR_FAILURE = 4;
export const OUTCOME_SERIOUS_FAILURE = 8;
export const OUTCOME_MAJOR_FAILURE = 12;

// Code	Display	Definition
// 0	Success	The operation completed successfully (whether with warnings or not).
// 4	Minor failure	The action was not successful due to some kind of minor failure (often equivalent to an HTTP 400 response).
// 8	Serious failure	The action was not successful due to some kind of unexpected error (often equivalent to an HTTP 500 response).
// 12	Major failure	An error of such magnitude occurred that the system is no longer available for use (i.e. the system died).

export type AuditEventAction = interfaces.audit.ActionType;
export type AuditEventOutcome =
  | typeof OUTCOME_SUCCESS
  | typeof OUTCOME_MINOR_FAILURE
  | typeof OUTCOME_SERIOUS_FAILURE
  | typeof OUTCOME_MAJOR_FAILURE;

@injectable()
export class AuditEventService {
  private static readonly MIN_AUDIT_LENGTH_FOR_DURATION_SECONDS = 10;

  constructor(
    @inject("Settings") private readonly settings: ElsaSettings,
    @inject("Database") private readonly edgeDbClient: edgedb.Client,
    @inject("Logger") private readonly logger: Logger,
    @inject(UserData) private readonly userData: UserData
  ) {}

  /**
   *
   * @param user
   * @param releaseKey?
   * @param executor the EdgeDb execution context (either client or transaction)
   * @returns
   */
  private async checkIsAllowedViewAuditEvents(
    user: AuthenticatedUser,
    releaseKey?: string,
    executor: Executor = this.edgeDbClient
  ): Promise<void> {
    // Check if user has the permission to view all audit events
    const dbUser = await this.userData.getDbUser(executor, user);

    if (dbUser.isAllowedOverallAdministratorView) return;

    // Check if user is part of release therefore have access
    if (releaseKey) {
      const userReleaseRole = (
        await releaseGetBoundaryInfo(executor, {
          userDbId: user.dbId,
          releaseKey: releaseKey,
        })
      )?.role;
      if (userReleaseRole) return;
    }

    throw new NotAuthorisedViewAudits(releaseKey);
  }

  /**
   * Start the entry for an audit event that occurs in a release context.
   *
   * @param user
   * @param releaseKey
   * @param actionCategory
   * @param actionDescription
   * @param start
   * @param executor the EdgeDb execution context (either client or transaction)
   */
  public async startReleaseAuditEvent(
    user: AuthenticatedUser,
    releaseKey: string,
    actionCategory: ActionType,
    actionDescription: string,
    start: Date = new Date(),
    executor: Executor = this.edgeDbClient
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
      inProgress: true,
    });

    await this.updateRelease(releaseKey, auditEvent, executor);

    await releaseLastUpdatedReset(executor, {
      releaseKey: releaseKey,
      lastUpdatedSubjectId: user.subjectId,
    });

    return auditEvent.id;
  }

  private async updateRelease(
    releaseKey: string,
    auditEvent: { id: string },
    executor: Executor
  ) {
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
  }

  /**
   * Complete the entry for an audit event that occurs in a release context.
   *
   * @param auditEventId
   * @param outcome
   * @param start
   * @param end
   * @param details?
   * @param executor the EdgeDb execution context (either client or transaction)
   */
  public async completeReleaseAuditEvent(
    auditEventId: string,
    outcome: AuditEventOutcome,
    start: Date,
    end: Date,
    details?: any,
    executor: Executor = this.edgeDbClient
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
            diffSeconds >
            AuditEventService.MIN_AUDIT_LENGTH_FOR_DURATION_SECONDS
              ? e.duration(diffDuration)
              : null,
          updatedDateTime: e.datetime_current(),
          inProgress: false,
        },
      }))
      .run(executor);
  }

  /**
   * Create a ReleaseAuditEvent in one go.
   *
   * @param user
   * @param releaseKey
   * @param actionCategory
   * @param actionDescription
   * @param details
   * @param outcome
   * @param occurredDateTime
   * @param executor the EdgeDb execution context (either client or transaction)
   */
  public async createReleaseAuditEvent(
    user: AuthenticatedUser,
    releaseKey: string,
    actionCategory: ActionType,
    actionDescription: string,
    details?: any,
    outcome: number = 0,
    occurredDateTime: Date = new Date(),
    executor: Executor = this.edgeDbClient
  ): Promise<string> {
    const auditEvent = await insertReleaseAuditEvent(executor, {
      whoId: user.subjectId,
      whoDisplayName: user.displayName,
      occurredDateTime,
      actionCategory,
      actionDescription,
      outcome,
      details,
    });

    await this.updateRelease(releaseKey, auditEvent, executor);

    return auditEvent.id;
  }

  /**
   * Start the entry for an audit event that occurs in a user context.
   *
   * @param whoId
   * @param whoDisplayName
   * @param userId
   * @param actionCategory
   * @param actionDescription
   * @param start
   * @param executor the EdgeDb execution context (either client or transaction)
   */
  public async startUserAuditEvent(
    whoId: string,
    whoDisplayName: string,
    userId: string,
    actionCategory: ActionType,
    actionDescription: string,
    start: Date = new Date(),
    executor: Executor = this.edgeDbClient
  ): Promise<string> {
    const auditEvent = await insertUserAuditEvent(executor, {
      whoId,
      whoDisplayName,
      actionCategory,
      actionDescription,
      occurredDateTime: start,
      outcome: 8,
      details: { errorMessage: "Audit entry not completed" },
      inProgress: true,
    });

    // TODO: get the insert AND the update to happen at the same time (easy) - but ALSO get it to return
    // the id of the newly inserted event (instead we can only get the release id)
    await this.updateUser(userId, auditEvent, executor);

    return auditEvent.id;
  }

  private async updateUser(
    userId: string,
    auditEvent: { id: string },
    executor: Executor = this.edgeDbClient
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
   * @param userId
   * @param whoId
   * @param whoDisplayName
   * @param actionCategory
   * @param actionDescription
   * @param details??
   * @param outcome
   * @param occurredDateTime
   * @param executor the EdgeDb execution context (either client or transaction)
   */
  public async createUserAuditEvent(
    userId: string,
    whoId: string,
    whoDisplayName: string,
    actionCategory: ActionType,
    actionDescription: string,
    details?: any,
    outcome: number = 0,
    occurredDateTime: Date = new Date(),
    executor: Executor = this.edgeDbClient
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
   * @param auditEventId
   * @param outcome
   * @param start
   * @param end
   * @param details
   * @param executor the EdgeDb execution context (either client or transaction)
   */
  public async completeUserAuditEvent(
    auditEventId: string,
    outcome: AuditEventOutcome,
    start: Date,
    end: Date,
    details: any,
    executor: Executor = this.edgeDbClient
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
            diffSeconds >
            AuditEventService.MIN_AUDIT_LENGTH_FOR_DURATION_SECONDS
              ? e.duration(diffDuration)
              : null,
          updatedDateTime: e.datetime_current(),
          inProgress: false,
        },
      }))
      .run(executor);
  }

  /**
   * Start the entry for a system audit event.
   *
   * @param actionCategory
   * @param actionDescription
   * @param start
   * @param executor the EdgeDb execution context (either client or transaction)
   * @param details
   * @param inProgress
   * @param outcome
   */
  public async startSystemAuditEvent(
    actionCategory: ActionType,
    actionDescription: string,
    start: Date = new Date(),
    executor: Executor = this.edgeDbClient,
    details: any = { errorMessage: "Audit entry not completed" },
    inProgress: boolean = true,
    outcome: number = 8
  ): Promise<string> {
    return (
      await insertSystemAuditEvent(executor, {
        actionCategory,
        actionDescription,
        occurredDateTime: start,
        outcome,
        details,
        inProgress,
      })
    ).id;
  }

  /**
   * Create a system audit event in one go.
   *
   * @param actionCategory
   * @param actionDescription
   * @param details?
   * @param outcome
   * @param executor the EdgeDb execution context (either client or transaction)
   */
  public async createSystemAuditEvent(
    actionCategory: ActionType,
    actionDescription: string,
    details?: any,
    outcome: number = 0,
    executor: Executor = this.edgeDbClient
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
   * @param auditEventId
   * @param outcome
   * @param start
   * @param end
   * @param details
   * @param executor the EdgeDb execution context (either client or transaction)
   */
  public async completeSystemAuditEvent(
    auditEventId: string,
    outcome: AuditEventOutcome,
    start: Date,
    end: Date,
    details: any,
    executor: Executor = this.edgeDbClient
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
            diffSeconds >
            AuditEventService.MIN_AUDIT_LENGTH_FOR_DURATION_SECONDS
              ? e.duration(diffDuration)
              : null,
          updatedDateTime: e.datetime_current(),
          inProgress: false,
        },
      }))
      .run(executor);
  }

  public async getReleaseEntries(
    user: AuthenticatedUser,
    releaseKey: string,
    limit: number,
    offset: number,
    orderByProperty: keyof AuditEvent = "occurredDateTime",
    orderAscending: boolean = false,
    executor: Executor = this.edgeDbClient
  ): Promise<PagedResult<AuditEventType> | null> {
    await this.checkIsAllowedViewAuditEvents(user, releaseKey, executor);

    const { total, data } = await auditEventGetSomeByUser(executor, {
      userDbId: user.dbId,
      limit,
      offset,
      orderByProperty,
      orderAscending,
      filterTypes: ["release"],
    });

    this.logger.debug(
      `${AuditEventService.name}.getEntries(releaseKey=${releaseKey}, limit=${limit}, offset=${offset}) -> total=${total}, pageOfEntries=...`
    );

    return createPagedResult(
      data.flatMap((entry) =>
        !entry.inProgress
          ? [
              {
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
              },
            ]
          : []
      ),
      total
    );
  }

  /**
   * Get User audit entries, filtering the result to include system or release entries, or to include all
   * users' events.
   *
   * @param filter
   * @param user
   * @param limit
   * @param offset
   * @param includeSystemEvents
   * @param orderByProperty
   * @param orderAscending
   * @param executor
   */
  public async getUserEntries(
    filter: RouteValidation.AuditEventUserFilterType[],
    user: AuthenticatedUser,
    limit: number,
    offset: number,
    includeSystemEvents: boolean = false,
    orderByProperty: keyof AuditEvent = "occurredDateTime",
    orderAscending: boolean = false,
    executor: Executor = this.edgeDbClient
  ): Promise<PagedResult<AuditEventType> | null> {
    if (filter.length === 0) {
      return null;
    }

    // These query filters require special permission.
    if (filter.includes("all") || filter.includes("system")) {
      await this.checkIsAllowedViewAuditEvents(user, undefined, executor);
    }

    const { total, data } = await auditEventGetSomeByUser(executor, {
      userDbId: user.dbId,
      limit,
      offset,
      orderByProperty,
      orderAscending,
      filterTypes: filter,
    });

    this.logger.debug(
      `${AuditEventService.name}.getEntries(user=${user}, limit=${limit}, offset=${offset}) -> total=${total}, pageOfEntries=...`
    );

    return createPagedResult(
      data.flatMap((entry) =>
        !entry.inProgress
          ? [
              {
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
                inProgress: entry.inProgress,
                hasDetails: entry.hasDetails,
              },
            ]
          : []
      ),
      total
    );
  }

  public async getSystemEntries(
    user: AuthenticatedUser,
    limit: number,
    offset: number,
    orderByProperty: keyof AuditEvent = "occurredDateTime",
    orderAscending: boolean = false,
    executor: Executor = this.edgeDbClient
  ): Promise<PagedResult<AuditEventType> | null> {
    // Only admin view users should be able to view system audit events.
    await this.checkIsAllowedViewAuditEvents(user, undefined, executor);

    const { total, data } = await auditEventGetSomeByUser(executor, {
      userDbId: user.dbId,
      limit,
      offset,
      orderByProperty,
      orderAscending,
      filterTypes: ["system"],
    });

    this.logger.debug(
      `${AuditEventService.name}.getEntries(limit=${limit}, offset=${offset}) -> total=${total}, pageOfEntries=...`
    );

    return createPagedResult(
      data.flatMap((entry) =>
        !entry.inProgress
          ? [
              {
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
              },
            ]
          : []
      ),
      total
    );
  }

  public async getEntryDetails(
    user: AuthenticatedUser,
    id: string,
    start: number,
    end: number,
    executor: Executor = this.edgeDbClient
  ): Promise<AuditEventDetailsType | null> {
    const entry = await auditEventGetSomeByUser(executor, {
      userDbId: user.dbId,
      filterAuditEventDbId: id,
      detailsMaxLength: end,
    });

    if (!entry || !entry.data || entry.data.length === 0) {
      return null;
    }

    return {
      objectId: entry.data[0].id,
      details: entry.data[0].detailsAsPrettyString ?? undefined,
      truncated: entry.data[0].detailsWereTruncated ?? undefined,
    };
  }

  public async getFullEntry(
    user: AuthenticatedUser,
    id: string,
    executor: Executor = this.edgeDbClient
  ): Promise<AuditEventFullType | null> {
    await this.checkIsAllowedViewAuditEvents(user, undefined, executor);

    const entry = await auditEventGetSomeByUser(executor, {
      userDbId: user.dbId,
      filterAuditEventDbId: id,
    });

    if (!entry || !entry.data || entry.data.length === 0) {
      return null;
    } else {
      return {
        objectId: entry.data[0].id,
        whoId: entry.data[0].whoId,
        whoDisplayName: entry.data[0].whoDisplayName,
        actionCategory: entry.data[0].actionCategory,
        actionDescription: entry.data[0].actionDescription,
        recordedDateTime: entry.data[0].recordedDateTime,
        updatedDateTime: entry.data[0].updatedDateTime,
        occurredDateTime: entry.data[0].occurredDateTime,
        occurredDuration: entry.data[0].occurredDuration?.toString(),
        outcome: entry.data[0].outcome,
        details: entry.data[0].detailsAsPrettyString,
      };
    }
  }

  /**
   * Add audit event when a user is added to a release.
   */
  public async updateUserAddedToRelease(
    subjectId: string,
    whoDisplayName: string,
    role: string,
    releaseKey: string,
    executor: Executor = this.edgeDbClient
  ) {
    return updateUserAuditEvents(executor, {
      subjectId,
      whoDisplayName,
      actionDescription: "Add user to release",
      details: {
        role,
        releaseKey,
      },
    });
  }

  /**
   * Add audit event when a user's permission is changed.
   */
  public async updateUserPermissionsChanged(
    subjectId: string,
    whoDisplayName: string,
    permission: any,
    executor: Executor = this.edgeDbClient
  ) {
    return updateUserAuditEvents(executor, {
      subjectId,
      whoDisplayName,
      actionDescription: "Change user permission",
      details: {
        permission,
      },
    });
  }

  /**
   * Add a sync dataset user audit event.
   */
  public async insertSyncDatasetAuditEvent(
    user: AuthenticatedUser,
    dataset: string,
    occurredDateTime: Date,
    executor: Executor = this.edgeDbClient
  ) {
    return await this.createUserAuditEvent(
      user.dbId,
      user.subjectId,
      user.displayName,
      "U",
      `Sync dataset: ${dataset}`,
      null,
      0,
      occurredDateTime,
      executor
    );
  }

  /**
   * Add audit event when database is added.
   */
  public async insertAddDatasetAuditEvent(
    user: AuthenticatedUser,
    dataset: string,
    executor: Executor = this.edgeDbClient
  ) {
    return await this.createUserAuditEvent(
      user.dbId,
      user.subjectId,
      user.displayName,
      "C",
      `Add dataset: ${dataset}`,
      undefined,
      0,
      new Date(),
      executor
    );
  }

  /**
   * Add audit event a release is viewed. Checks the database to make sure a recent
   * audit event does not already exist.
   */
  public async insertViewedReleaseAuditEvent(
    user: AuthenticatedUser,
    releaseKey: string,
    delay: Duration,
    occurredDateTime: Date,
    executor: Executor = this.edgeDbClient
  ): Promise<string | null> {
    let recentAuditEvents = await auditEventGetMostRecent(executor, {
      whoId: user.subjectId,
      since: sub(occurredDateTime, delay),
      releaseKey,
    });

    if (recentAuditEvents.length === 0) {
      return await this.createReleaseAuditEvent(
        user,
        releaseKey,
        "R",
        `Viewed release: ${releaseKey}`,
        undefined,
        0,
        occurredDateTime,
        executor
      );
    }

    return null;
  }

  /**
   * Add audit event when dataset is deleted.
   */
  public async insertDeleteDatasetAuditEvent(
    user: AuthenticatedUser,
    dataset: string,
    executor: Executor = this.edgeDbClient
  ) {
    return await this.createUserAuditEvent(
      user.dbId,
      user.subjectId,
      user.displayName,
      "D",
      `Delete dataset: ${dataset}`,
      undefined,
      0,
      new Date(),
      executor
    );
  }

  /**
   * Perform our standard audit pattern for a create to a release
   * including transactions and try/catch.
   *
   * @param user
   * @param releaseKey
   * @param actionDescription
   * @param initFunc
   * @param transFunc
   * @param finishFunc
   * @param isResultSecureString
   */
  public async transactionalReadInReleaseAuditPattern<T, U, V>(
    user: AuthenticatedUser,
    releaseKey: string,
    actionDescription: string,
    initFunc: () => Promise<T>,
    transFunc: (tx: Transaction, a: T) => Promise<U>,
    finishFunc: (a: U) => Promise<V>,
    isResultSecureString?: boolean
  ) {
    return this.transactionalAuditPattern(
      user,
      releaseKey,
      "R",
      actionDescription,
      initFunc,
      transFunc,
      finishFunc,
      isResultSecureString
    );
  }

  /**
   * Perform our standard audit pattern for a create to a release
   * including transactions and try/catch.
   *
   * @param user
   * @param releaseKey
   * @param actionDescription
   * @param initFunc
   * @param transFunc
   * @param finishFunc
   */
  public async transactionalCreateInReleaseAuditPattern<T, U, V>(
    user: AuthenticatedUser,
    releaseKey: string,
    actionDescription: string,
    initFunc: () => Promise<T>,
    transFunc: (tx: Transaction, a: T) => Promise<U>,
    finishFunc: (a: U) => Promise<V>
  ) {
    return this.transactionalAuditPattern(
      user,
      releaseKey,
      "C",
      actionDescription,
      initFunc,
      transFunc,
      finishFunc
    );
  }

  /**
   * Perform our standard audit pattern for an update to a release
   * including transactions and try/catch.
   *
   * @param user
   * @param releaseKey
   * @param actionDescription
   * @param initFunc
   * @param transFunc
   * @param finishFunc
   */
  public async transactionalUpdateInReleaseAuditPattern<T, U, V>(
    user: AuthenticatedUser,
    releaseKey: string,
    actionDescription: string,
    initFunc: () => Promise<T>,
    transFunc: (tx: Transaction, a: T) => Promise<U>,
    finishFunc: (a: U) => Promise<V>
  ) {
    return this.transactionalAuditPattern(
      user,
      releaseKey,
      "U",
      actionDescription,
      initFunc,
      transFunc,
      finishFunc
    );
  }

  /**
   * Perform our standard audit pattern for a delete to a release
   * including transactions and try/catch.
   *
   * @param user
   * @param releaseKey
   * @param actionDescription
   * @param initFunc
   * @param transFunc
   * @param finishFunc
   */
  public async transactionalDeleteInReleaseAuditPattern<T, U, V>(
    user: AuthenticatedUser,
    releaseKey: string,
    actionDescription: string,
    initFunc: () => Promise<T>,
    transFunc: (tx: Transaction, a: T) => Promise<U>,
    finishFunc: (a: U) => Promise<V>
  ) {
    return this.transactionalAuditPattern(
      user,
      releaseKey,
      "D",
      actionDescription,
      initFunc,
      transFunc,
      finishFunc
    );
  }

  /**
   * Standard non-transactional system audit event pattern
   */
  public async systemAuditEventPattern<T>(
    actionDescription: string,
    tryFunc: (
      completeAudit: (details: any, executor: Executor) => Promise<void>
    ) => Promise<T>,
    startDetails: any = { errorMessage: "Audit entry not completed" },
    inProgress: boolean = true,
    startOutcome: number = 8
  ): Promise<T> {
    return this.auditPattern(
      async (start) => {
        return await this.startSystemAuditEvent(
          "E",
          actionDescription,
          start,
          this.edgeDbClient,
          startDetails,
          inProgress,
          startOutcome
        );
      },
      this.completeSystemAuditEvent,
      tryFunc
    );
  }

  /**
   * Perform our standard audit pattern for a execute to a release
   * including transactions and try/catch.
   *
   * @param user
   * @param releaseKey
   * @param actionDescription
   * @param initFunc
   * @param transFunc
   * @param finishFunc
   */
  public async transactionalExecuteInReleaseAuditPattern<T, U, V>(
    user: AuthenticatedUser,
    releaseKey: string,
    actionDescription: string,
    initFunc: () => Promise<T>,
    transFunc: (tx: Transaction, a: T) => Promise<U>,
    finishFunc: (a: U) => Promise<V>
  ) {
    return this.transactionalAuditPattern(
      user,
      releaseKey,
      "E",
      actionDescription,
      initFunc,
      transFunc,
      finishFunc
    );
  }

  /**
   * The transaction audit pattern for releases executes the three
   * given functions in a chain, but interspersed with audit
   * start/success/failure functionality.
   *
   * @param user the user performing the action
   * @param releaseKey the release key the action is occurring in the context of
   * @param actionCategory the category of audit action
   * @param actionDescription the static action description
   * @param initFunc
   * @param transFunc
   * @param finishFunc
   * @param isResultSecureString
   */
  protected async transactionalAuditPattern<T, U, V>(
    user: AuthenticatedUser,
    releaseKey: string,
    actionCategory: ActionType,
    actionDescription: string,
    initFunc: () => Promise<T>,
    transFunc: (tx: Transaction, a: T) => Promise<U>,
    finishFunc: (a: U) => Promise<V>,
    isResultSecureString?: boolean
  ) {
    return await this.auditPattern(
      async (start) => {
        return await this.startReleaseAuditEvent(
          user,
          releaseKey,
          actionCategory,
          actionDescription,
          start,
          this.edgeDbClient
        );
      },
      this.completeReleaseAuditEvent,
      async (completeAudit) => {
        const initBlockResult = await initFunc();

        const transResult = await this.edgeDbClient.transaction(async (tx) => {
          const transBlockResult = await transFunc(tx, initBlockResult);

          await completeAudit(transBlockResult, tx);

          return transBlockResult;
        });

        return await finishFunc(transResult);
      },
      isResultSecureString
    );
  }

  /**
   * The general audit pattern in a try catch block. Starts an audit event, then executes a function
   * in a try block, which must complete the audit event, or if an error is throw, completes a failed
   * audit event.
   */
  protected async auditPattern<R, T>(
    startAuditFn: (start: Date) => Promise<string>,
    completeAuditFn: (
      this: AuditEventService,
      auditEventId: string,
      outcome: AuditEventOutcome,
      start: Date,
      end: Date,
      details: any,
      executor: Executor
    ) => Promise<void>,
    tryFn: (
      completeAuditFn: (details: any, executor: Executor) => Promise<void>
    ) => Promise<R>,
    isDetailSecretString?: boolean
  ): Promise<R> {
    // Is this refactor getting out of hand?
    const auditEventStart = new Date();
    const auditEventId = await startAuditFn(auditEventStart);

    try {
      return await tryFn(async (details, executor) => {
        // Hide if details is secure string
        const hiddenString = isDetailSecretString
          ? details.slice(0, 4).padEnd(details.length, "*")
          : null;

        await completeAuditFn.call(
          this,
          auditEventId,
          OUTCOME_SUCCESS,
          auditEventStart,
          new Date(),
          hiddenString ?? details,
          executor
        );
      });
    } catch (error) {
      // TODO possibly better breakdown of the details of the error
      const errorString =
        error instanceof Error ? error.message : String(error);

      await completeAuditFn.call(
        this,
        auditEventId,
        OUTCOME_SUCCESS,
        auditEventStart,
        new Date(),
        { error: errorString },
        this.edgeDbClient
      );

      throw error;
    }
  }
}
