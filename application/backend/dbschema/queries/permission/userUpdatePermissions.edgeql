# Update the permissions of a user.
with
  # The database id of the user.
  subjectId := <str>$subjectId,
  # Update the refresh dataset index permission.
  isAllowedRefreshDatasetIndex := <bool>$isAllowedRefreshDatasetIndex,
  # Update the create release permission.
  isAllowedCreateRelease := <bool>$isAllowedCreateRelease,
  # Update the overall administrator view permission.
  isAllowedOverallAdministratorView := <bool>$isAllowedOverallAdministratorView,
  
module permission
update User
filter .subjectId = subjectId
set {
  isAllowedRefreshDatasetIndex := isAllowedRefreshDatasetIndex,
  isAllowedCreateRelease := isAllowedCreateRelease,
  isAllowedOverallAdministratorView := isAllowedOverallAdministratorView
};
