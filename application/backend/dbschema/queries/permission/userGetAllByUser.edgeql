# Get details of users in the system
# if passed in an empty $userDbId then the caller is treated as
# someone who can see all records
# if passed $isSuperAdmin as true, then the user can see all the
# records but will do so with correct identification of the caller user
# (this is the preferred path if there is indeed a calling user)

with
  # by default we can only see ourselves - but if we are executing outside the
  # context of any user OR if we have the right permissions then
  # we may instead get all the other users
  canSeeOtherUsers := <bool>$isSuperAdmin
     or (
        select not exists <optional uuid>$userDbId
     )
     or (
        select permission::User { isAllowedOverallAdministratorView } filter .id = <optional uuid>$userDbId
     )
     .isAllowedOverallAdministratorView,

  # u is the set of all users that can be viewed
  u := (
    select permission::User
    filter .id = <optional uuid>$userDbId or canSeeOtherUsers
  )

select {
  total := count(u),
  data := (
    select u {
      *,
      # for ordering, a field that says if this is the record of the caller
      isCaller := .id = <optional uuid>$userDbId,
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
