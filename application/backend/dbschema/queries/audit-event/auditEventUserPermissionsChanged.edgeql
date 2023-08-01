# add a user audit event when adding a user to a release.

with
  # The database id of the user being updated.
  userDbId := <uuid>$userDbId,
  # The subject id of the user.
  whoId := <str>$whoId,
  # The display name of the user.
  whoDisplayName := <str>$whoDisplayName,
  # The permission changed. Used for formatting details.
  permission := <json>$permission,

module permission
update User
filter .id = userDbId
set {
  userAuditEvent += (
    insert audit::UserAuditEvent {
      whoId := whoId,
      whoDisplayName := whoDisplayName,
      occurredDateTime := datetime_current(),
      actionCategory := 'E',
      actionDescription := 'Change user permission',
      outcome := 0,
      details := permission,
      inProgress := false
    }
  )
};