# Gets the details of a single audit event including the ability to optionally
# truncate the amount of details data returned
# This method applies all required permissions rules to ensure that the given
# user is allowed to see this event and returns an empty result if not

with
  # an optional parameter defining the max length of details to return
  # if not specified, use -1 to mean get the whole details as a 'pretty' string
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

  # the audit entries we can see (can optionally be restricted to just one entry)
  e := (
    select audit::AuditEvent {
      release := assert_single([is audit::ReleaseAuditEvent].release_),
      user := assert_single([is audit::UserAuditEvent].user_),
      whoSubjectId := assert_single([is audit::UserAuditEvent].whoId),
      whoDisplayName := assert_single([is audit::UserAuditEvent].whoDisplayName)
    }
    filter
        # a special filter clause that can optionally pin point a single entry, else gets all
        (.id = <optional uuid>$auditEventDbId if exists(<optional uuid>$auditEventDbId) else true) and
        # and whether we are getting all or only one - we also need to filter by visibility rules
        (
           # if the user is an admin viewer they can see
           (u.isAllowedOverallAdministratorView) or
           # if the user created the event they can see
           (u ?= .user) or
           # if the user is participating in a release that this is an event of they can see
           ((.release in u.releaseParticipant) ?? false)
        )
  )

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
      whoSubjectId,
      whoDisplayName,
      releaseId := .release.id,
      detailsAsPrettyString := to_str(.details, 'pretty')[0 : m],
      detailsWereTruncated := len(to_str(.details, 'pretty')) >= m
    }
    order by
        to_str(.updatedDateTime) if <optional str>$orderField ?= 'updatedDateTime' else
        to_str(.outcome)
    offset <optional int64>$offset
    limit  <optional int64>$limit)
}
