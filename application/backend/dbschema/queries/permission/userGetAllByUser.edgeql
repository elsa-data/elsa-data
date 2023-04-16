# get details of all the users in the system

with
  # by default we can only see ourselves - but if we have the right permissions
  # we may instead get all the other users
  canSeeOtherUsers := (
    select permission::User {
      isAllowedOverallAdministratorView
    }
    filter .id = <uuid>$userDbId
  )
  .isAllowedOverallAdministratorView or <bool>$isSuperAdmin,

  # u is the set of all users that can be viewed
  u := (
    select permission::User
    filter .id = <uuid>$userDbId or canSeeOtherUsers
  )

select {
  total := count(u),
  data := (
    select u {
      id,
      subjectId,
      email,
      displayName,
      lastLoginDateTime,
      isAllowedRefreshDatasetIndex,
      isAllowedCreateRelease,
      isAllowedOverallAdministratorView,
      # for ordering a field that says if this is record of the caller
      isCaller := .id = <uuid>$userDbId,
      # for ordering, some score of 'important' people
      rightsCount := (1 if .isAllowedRefreshDatasetIndex else 0) +
                     (1 if .isAllowedCreateRelease else 0) +
                     (1 if .isAllowedOverallAdministratorView else 0)
    }
    order by .isCaller DESC then .rightsCount DESC then .lastLoginDateTime DESC
    offset <optional int64>$offset
    limit  <optional int64>$limit
  )
}
