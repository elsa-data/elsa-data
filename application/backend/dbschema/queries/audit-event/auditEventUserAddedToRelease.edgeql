# add a user audit event when adding a user to a release.

with
  # The database id of the user being updated.
  userDbId := <uuid>$userDbId,
  # The subject id of the user.
  whoId := <str>$whoId,
  # The display name of the user.
  whoDisplayName := <str>$whoDisplayName,
  # The role of the user in the release. Used for formatting details.
  role := <str>$role,
  # The key of the release. Used for formatting the audit event details.
  releaseKey := <str>$releaseKey,

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
      actionDescription := 'Add user to release',
      outcome := 0,
      details := to_json(
        '{ "role": "' ++ <str>role ++ '"' ++
          ', "releaseKey": "' ++ releaseKey ++ '"' ++
        ' }'
      ),
      inProgress := false
    }
  )
};