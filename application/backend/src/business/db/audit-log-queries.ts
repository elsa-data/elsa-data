import e from "../../../dbschema/edgeql-js";
import { RouteValidation } from "@umccr/elsa-types";
import * as interfaces from "../../../dbschema/interfaces";

import ReleaseAuditEvent = interfaces.audit.ReleaseAuditEvent;
import AuditEvent = interfaces.audit.AuditEvent;
import AuditEventUserFilterType = RouteValidation.AuditEventUserFilterType;

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
 * An EdgeDb query to count the audit log entries associated
 * with a given user.
 */
export const countAuditLogEntriesForUserQuery = e.params(
  {
    userId: e.uuid,
  },
  (params) =>
    e.count(
      e.select(e.audit.UserAuditEvent, (ae) => ({
        filter: e.op(ae.user_.id, "=", params.userId),
      }))
    )
);

/**
 * Common properties for audit events.
 */
export const auditEventProperties = {
  id: true,
  actionCategory: true,
  actionDescription: true,
  recordedDateTime: true,
  updatedDateTime: true,
  occurredDateTime: true,
  occurredDuration: true,
  outcome: true,
  inProgress: true,
} as const;

/**
 * Common properties for owned audit events.
 */
export const ownedAuditEventProperties = {
  ...auditEventProperties,
  whoId: true,
  whoDisplayName: true,
} as const;

/**
 * An EdgeDb query for the audit log details associated with an id.
 */
export const auditLogDetailsForIdQuery = (
  id: string,
  start: number,
  end: number
) => {
  const detailsStr = (auditEvent: any) =>
    e.to_str(auditEvent.details, "pretty");

  return e.select(e.audit.AuditEvent, (auditEvent) => ({
    id: true,
    detailsStr: detailsStr(auditEvent).slice(start, end),
    truncated: e.op(e.len(detailsStr(auditEvent)), ">=", end),
    filter_single: { id: e.uuid(id) },
  }));
};

/**
 * An EdgeDb query for the full audit log event associated with an id.
 */
export const auditLogFullForIdQuery = (id: string) => {
  return e.select(e.audit.AuditEvent, (_) => ({
    ...e.audit.AuditEvent["*"],
    ...e.is(e.audit.OwnedAuditEvent, { whoId: true }),
    ...e.is(e.audit.OwnedAuditEvent, { whoDisplayName: true }),
    filter_single: { id: e.uuid(id) },
  }));
};

/**
 * A pageable EdgeDb query for the audit log entries associated with
 * a given release.
 */
export const pageableAuditLogEntriesForReleaseQuery = (
  releaseKey: string,
  limit: number,
  offset: number,
  orderByProperty: keyof ReleaseAuditEvent = "occurredDateTime",
  orderAscending: boolean = false
) => {
  return e.select(e.audit.ReleaseAuditEvent, (auditEvent) => ({
    ...ownedAuditEventProperties,
    hasDetails: e.op("exists", auditEvent.details),
    filter: e.op(auditEvent.release_.releaseKey, "=", releaseKey),
    order_by: [
      {
        expression:
          orderByProperty === "actionCategory"
            ? e.cast(e.str, auditEvent.actionCategory)
            : auditEvent[orderByProperty],
        direction: orderAscending ? e.ASC : e.DESC,
      },
      {
        expression: auditEvent.occurredDateTime,
        direction: e.DESC,
      },
    ],
    limit: limit,
    offset: offset,
  }));
};

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

/**
 * A pageable EdgeDb query for the audit log entries associated with
 * a given release.
 */
export const pageableAuditEventsForUserInRelease = (
  userIds: [string] | "all",
  limit: number,
  offset: number,
  computeDetails: boolean = true,
  paginate: boolean = true,
  orderByProperty: keyof ReleaseAuditEvent = "occurredDateTime",
  orderAscending: boolean = false
) => {
  return e.select(e.audit.ReleaseAuditEvent, (auditEvent) => ({
    ...ownedAuditEventProperties,
    ...(computeDetails && {
      hasDetails: e.op("exists", auditEvent.details),
    }),
    ...(userIds !== "all" && {
      filter: e.op(
        e.array_unpack(e.literal(e.array(e.uuid), userIds)),
        "in",
        auditEvent.release_.participants.id
      ),
    }),
    ...(paginate && {
      order_by: [
        {
          expression:
            orderByProperty === "actionCategory"
              ? e.cast(e.str, auditEvent.actionCategory)
              : auditEvent[orderByProperty],
          direction: orderAscending ? e.ASC : e.DESC,
        },
        {
          expression: auditEvent.occurredDateTime,
          direction: e.DESC,
        },
      ],
      limit: limit,
      offset: offset,
    }),
  }));
};

/**
 * A pageable EdgeDb query for the audit log events associated with
 * a given user and system events.
 */
export const pageableAuditEventsQuery = (
  filter: Omit<AuditEventUserFilterType, "all">[],
  userIds: [string] | "all",
  limit: number,
  offset: number,
  paginate: boolean = true,
  orderByProperty: keyof AuditEvent = "occurredDateTime",
  orderAscending: boolean = false
) => {
  const union = e.for(
    e.array_unpack(
      e.literal(
        e.array(e.str),
        filter.map((v) => v.toString())
      )
    ),
    (f) => {
      return e.op(
        pageableAuditEventsForUserInRelease(
          userIds,
          limit,
          offset,
          false,
          false,
          orderByProperty,
          orderAscending
        ),
        "if",
        e.op(f, "=", "release"),
        "else",
        e.op(
          pageableAuditLogEntriesForUserQuery(
            userIds,
            limit,
            offset,
            false,
            false,
            orderByProperty,
            orderAscending
          ),
          "if",
          e.op(f, "=", "user"),
          "else",
          pageableAuditLogEntriesForSystemQuery(
            limit,
            offset,
            false,
            false,
            orderByProperty,
            orderAscending
          )
        )
      );
    }
  );

  return {
    count: e.count(union),
    entries: e.select(union, (auditEvent) => ({
      ...auditEventProperties,
      ...e.is(e.audit.OwnedAuditEvent, { whoId: true }),
      ...e.is(e.audit.OwnedAuditEvent, { whoDisplayName: true }),
      hasDetails: e.op("exists", auditEvent.details),
      ...(paginate && {
        order_by: [
          {
            expression:
              orderByProperty === "actionCategory"
                ? e.cast(e.str, auditEvent.actionCategory)
                : auditEvent[orderByProperty],
            direction: orderAscending ? e.ASC : e.DESC,
          },
          {
            expression: auditEvent.occurredDateTime,
            direction: e.DESC,
          },
        ],
        limit: limit,
        offset: offset,
      }),
    })),
  };
};

/**
 * A pageable EdgeDb query for the audit log entries associated with
 * a given user.
 */
export const pageableAuditLogEntriesForUserQuery = (
  userIds: [string] | "all",
  limit: number,
  offset: number,
  computeDetails: boolean = true,
  paginate: boolean = true,
  orderByProperty: keyof AuditEvent = "occurredDateTime",
  orderAscending: boolean = false
) => {
  return e.select(
    e.audit.AuditEvent.is(e.audit.UserAuditEvent),
    (auditEvent) => ({
      ...ownedAuditEventProperties,
      ...(computeDetails && {
        hasDetails: e.op("exists", auditEvent.details),
      }),
      ...(userIds !== "all" && {
        filter: e.contains(
          e.literal(e.array(e.uuid), userIds),
          auditEvent.user_.id
        ),
      }),
      ...(paginate && {
        order_by: [
          {
            expression:
              orderByProperty === "actionCategory"
                ? e.cast(e.str, auditEvent.actionCategory)
                : auditEvent[orderByProperty],
            direction: orderAscending ? e.ASC : e.DESC,
          },
          {
            expression: auditEvent.occurredDateTime,
            direction: e.DESC,
          },
        ],
        limit: limit,
        offset: offset,
      }),
    })
  );
};

/**
 * A pageable EdgeDb query for system audit log entries.
 */
export const pageableAuditLogEntriesForSystemQuery = (
  limit: number,
  offset: number,
  computeDetails: boolean = true,
  paginate: boolean = true,
  orderByProperty: keyof AuditEvent = "occurredDateTime",
  orderAscending: boolean = false
) => {
  return e.select(e.audit.SystemAuditEvent, (auditEvent) => ({
    ...auditEventProperties,
    ...(computeDetails && {
      hasDetails: e.op("exists", auditEvent.details),
    }),
    ...(paginate && {
      order_by: [
        {
          expression:
            orderByProperty === "actionCategory"
              ? e.cast(e.str, auditEvent.actionCategory)
              : auditEvent[orderByProperty],
          direction: orderAscending ? e.ASC : e.DESC,
        },
        {
          expression: auditEvent.occurredDateTime,
          direction: e.DESC,
        },
      ],
      limit: limit,
      offset: offset,
    }),
  }));
};
