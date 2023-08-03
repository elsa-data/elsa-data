# add a successful audit event to the user.

with
  # The subject id of the user being updated.
  subjectId := <str>$subjectId,
  # The display name of the user.
  whoDisplayName := <str>$whoDisplayName,
  # The description of the audit event.
  actionDescription := <str>$actionDescription,
  # The details for the audit event.
  details := <json>$details,

module permission
update User
filter .subjectId = subjectId
set {
  userAuditEvent += (
    insert audit::UserAuditEvent {
      whoId := subjectId,
      whoDisplayName := whoDisplayName,
      occurredDateTime := datetime_current(),
      actionCategory := 'E',
      actionDescription := actionDescription,
      outcome := 0,
      details := details,
      inProgress := false
    }
  )
};
