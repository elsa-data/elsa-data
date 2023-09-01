# Update the permissions of a potential user.
with
  # The email of the target user.
  email := <str>$email,
  # Update the refresh dataset index permission.
  isAllowedRefreshDatasetIndex := <bool>$isAllowedRefreshDatasetIndex,
  # Update the create release permission.
  isAllowedCreateRelease := <bool>$isAllowedCreateRelease,
  # Update the overall administrator view permission.
  isAllowedOverallAdministratorView := <bool>$isAllowedOverallAdministratorView,
  
module permission
update PotentialUser
filter .email = email
set {
  isAllowedRefreshDatasetIndex := isAllowedRefreshDatasetIndex,
  isAllowedCreateRelease := isAllowedCreateRelease,
  isAllowedOverallAdministratorView := isAllowedOverallAdministratorView
};
