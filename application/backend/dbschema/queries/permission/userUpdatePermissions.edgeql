# Update the permissions of a user.
with
  # The database id of the user.
  userDbId := <uuid>$userDbId,
  # Update the refresh dataset index permission.
  isAllowedRefreshDatasetIndex := <bool>$isAllowedRefreshDatasetIndex,
  # Update the create release permission.
  isAllowedCreateRelease := <bool>$isAllowedCreateRelease,
  # Update the overall administrator view permission.
  isAllowedOverallAdministratorView := <bool>$isAllowedOverallAdministratorView,
  
module permission
update User
filter .id = <uuid>$userDbId
set {
  isAllowedRefreshDatasetIndex := isAllowedRefreshDatasetIndex,
  isAllowedCreateRelease := isAllowedCreateRelease,
  isAllowedOverallAdministratorView := isAllowedOverallAdministratorView
};