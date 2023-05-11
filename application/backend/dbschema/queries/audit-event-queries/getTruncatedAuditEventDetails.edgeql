# Gets the details of a single audit event including the ability to optionally
# truncate the amount of details data returned
# This method applies all required permissions rules to ensure that the given
# user is allowed to see this event and returns an empty result if not

with
  # an optional parameter defining the max length of details to return
  # if not specified, use -1 to mean get the whole string
  m := <optional int64>$detailsMaxLength if exists(<optional int64>$detailsMaxLength) else -1,

  # the user asking for audit entries
  u := assert_single((
    select permission::User {
      id,
      isAllowedOverallAdministratorView,
      releaseParticipant
    }
    filter .id = <uuid>$userDbId
  )),

  # the audit entry if we can see it
  e := (
    select audit::AuditEvent {
      actionCategory,
      actionDescription,
      recordedDateTime,
      updatedDateTime,
      occurredDateTime,
      occurredDuration,
      outcome,
      prettyDetails := to_str(.details, 'pretty'),
      release := assert_single([is audit::ReleaseAuditEvent].release_),
      user := [is audit::UserAuditEvent].user_
    }
    filter .id = <uuid>$auditEventDbId and
             (
               (u in .user) or
               (u.isAllowedOverallAdministratorView) or
               ((.release in u.releaseParticipant) ?? false)
             )
  )

select e {
  id,
  actionCategory,
  actionDescription,
  recordedDateTime,
  updatedDateTime,
  occurredDateTime,
  occurredDuration,
  outcome,
  detailsAsPrettyString := .prettyDetails[0 : m],
  detailsWereTruncated := len(.prettyDetails) >= m
}
