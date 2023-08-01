# Gets the details of audit events including the ability to optionally
# truncate the amount of JSON details data returned
#
# This query can filter by audit event type or can be used to return a single audit event
#
# This query applies all required permissions rules to ensure that the given
# user is allowed to see the events and returns an empty result if not
#
# WIP - this cannot filter/order the resulting set with as much power as the
# hand written Typescript queries - so this is not yet enabled for most querying in Elsa Data

with
  # an optional parameter defining the max length of details to return as a 'pretty' string - if not
  # specified defaults to -1 which effectively gets the whole string
  m := <optional int64>$detailsMaxLength if exists(<optional int64>$detailsMaxLength) else -1,

  # What to order the results by. Defaults to `occurredDateTime`.
  orderByProperty := <optional str>$orderByProperty,
  # Whether to order the properties in ascending order. Defaults to `false`, ordering by descending order.
  orderAscending := <optional bool>$orderAscending ?? false,

  # the user asking for audit entries
  u := assert_single((
    select permission::User {
      id,
      isAllowedOverallAdministratorView,
      releaseParticipant
    }
    filter .id = <uuid>$userDbId
  )),

  # the audit entries we can see
  # - can be filtered by audit event type
  # - can be filtered to pick out one single event
  # - will ALWAYS be filtered by user view permissions
  e := (
    select audit::AuditEvent {
      isSystemAuditEvent := exists([is audit::SystemAuditEvent]),
      isUserAuditEvent := exists([is audit::UserAuditEvent]),
      isReleaseAuditEvent := exists([is audit::ReleaseAuditEvent]),
      release := assert_single([is audit::ReleaseAuditEvent].release_),
      user := assert_single([is audit::UserAuditEvent].user_),
      whoSubjectId := assert_single([is audit::UserAuditEvent].whoId),
      whoDisplayName := assert_single([is audit::UserAuditEvent].whoDisplayName),
    }
    filter
        # a special filter clause that can optionally pin point a single entry if passed in $filterAuditEventDbId
        # OR filter by audit event type if passed in $filterTypes
        # ELSE return all
        (.id = <optional uuid>$filterAuditEventDbId if exists(<optional uuid>$filterAuditEventDbId) else
           (
             (.isSystemAuditEvent and contains(<optional array<str>>$filterTypes, 'system')) or
             (.isUserAuditEvent and contains(<optional array<str>>$filterTypes, 'user')) or
             (.isReleaseAuditEvent and contains(<optional array<str>>$filterTypes, 'release'))
           ) if exists(<optional array<str>>$filterTypes) else
             true
        )
        # and now (optional) individual field filters
        and (.outcome = <optional int16>$filterOutcome if exists(<optional int16>$filterOutcome) else true)
        and (.actionCategory = <optional audit::ActionType>$filterActionCategory if exists(<optional audit::ActionType>$filterActionCategory) else true)
        and (.actionDescription ilike <optional str>$filterActionDescriptionPattern if exists(<optional str>$filterActionDescriptionPattern) else true)
        and
        # and whether we have been filter above or not, we always need to filter by visibility rules
        (
           # if the user is an admin viewer and wants to see all events
           (u.isAllowedOverallAdministratorView and contains(<optional array<str>>$filterTypes, 'all')) or
           # if the user created the event they can see
           (u ?= .user) or
           # if the user is participating in a release that this is an event of they can see
           ((.release in u.releaseParticipant) ?? false)
        )
  ),

select {
  total := count(e),
  data := (select e {
      id,
      actionCategory,
      actionDescription,
      recordedDateTime,
      updatedDateTime,
      occurredDateTime,
      occurredDuration,
      outcome,
      inProgress,
      isSystemAuditEvent,
      isUserAuditEvent,
      whoSubjectId,
      whoDisplayName,
      isReleaseAuditEvent,
      releaseId := .release.id,
      detailsAsPrettyString := to_str(.details, 'pretty')[0 : m] if exists(.details) else "",
      detailsWereTruncated := exists(.details) and m >= 0 and len(to_str(.details, 'pretty')) >= m,
      hasDetails := exists(.details)
    }
    order by (
      <str>.updatedDateTime if orderByProperty = "updatedDateTime" and <str>orderAscending = "true" else
      <str>.actionCategory if orderByProperty = "actionCategory" and <str>orderAscending = "true" else
      <str>.actionDescription if orderByProperty = "actionDescription" and <str>orderAscending = "true" else
      <str>.details if orderByProperty = "details" and <str>orderAscending = "true" else
      <str>.occurredDateTime if orderByProperty = "occuredDateTime" and <str>orderAscending = "true" else
      <str>.occurredDuration if orderByProperty = "occurredDuration" and <str>orderAscending = "true" else
      <str>.outcome if orderByProperty = "outcome" and <str>orderAscending = "true" else
      <str>.recordedDateTime if orderByProperty = "recordedDateTime" and <str>orderAscending = "true" else
      <str>.inProgress if orderByProperty = "inProgress" and <str>orderAscending = "true" else
      ""
    ) asc then (
      <str>.updatedDateTime if orderByProperty = "updatedDateTime" and <str>orderAscending = "false" else
      <str>.actionCategory if orderByProperty = "actionCategory" and <str>orderAscending = "false" else
      <str>.actionDescription if orderByProperty = "actionDescription" and <str>orderAscending = "false" else
      <str>.details if orderByProperty = "details" and <str>orderAscending = "false" else
      <str>.occurredDateTime if orderByProperty = "occuredDateTime" and <str>orderAscending = "false" else
      <str>.occurredDuration if orderByProperty = "occurredDuration" and <str>orderAscending = "false" else
      <str>.outcome if orderByProperty = "outcome" and <str>orderAscending = "false" else
      <str>.recordedDateTime if orderByProperty = "recordedDateTime" and <str>orderAscending = "false" else
      <str>.inProgress if orderByProperty = "inProgress" and <str>orderAscending = "false" else
      <str>.occurredDateTime
    ) desc
    offset <optional int64>$offset
    limit  <optional int64>$limit)
}
