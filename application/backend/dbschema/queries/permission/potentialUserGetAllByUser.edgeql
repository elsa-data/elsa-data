# Get details of potential user that has been invited/entered to the system

with
  # potential user can only bee seen by someone who has admin view access
  canSeeOtherUsers := <bool>$isSuperAdmin
     or (
        select permission::User { isAllowedOverallAdministratorView } filter .id = <optional uuid>$userDbId
     )
     .isAllowedOverallAdministratorView,
  # pu is the set of all users that can be viewed
  pu := (
    select permission::PotentialUser
    filter canSeeOtherUsers
  )

select {
  total := count(pu),
  data := (
    select pu {
      *,
      # for ordering, some score of 'important' people
      rightsCount := (1 if .isAllowedRefreshDatasetIndex else 0) +
                     (1 if .isAllowedCreateRelease else 0) +
                     (1 if .isAllowedOverallAdministratorView else 0)
    }
    order by .rightsCount DESC then .createdDateTime DESC
    offset <optional int64>$offset
    limit  <optional int64>$limit
  )
}
