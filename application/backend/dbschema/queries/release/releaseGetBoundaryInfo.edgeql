# a light as possible query that can be executed on the boundary
# of any interaction with a single release
# returns just enough information including what role the given user
# plays in the release, whether release is locked and the fact the releaseKey
# is valid (given it may have come from an untrusted source - the fact that
# anything is returned validates the releaseKey)


with 

  r :=  (
          select release::Release {
            userRole := (
                          select .<releaseParticipant[is permission::User] {@role}
                          filter .id = <uuid>$userDbId
                        ),
          }
          # if no userRole then $userDbId is not participating
          filter .releaseKey = <str>$releaseKey
        ),

  u := (select assert_single(
         (select permission::User { * } filter .id = <uuid>$userDbId)
       )),

  isAllowed := (
    select exists(r.userRole)
    or 
    u.isAllowedOverallAdministratorView
  )

select r {
    runningJob,
    activation,

    # relay out the role in the release or null if no role but can see this via isAllowedOverallAdministratorView
    role := (select assert_single(.userRole@role)),

    # also relay out the current permissions of the user as this *might* be useful
    # and might save us another db round trip (and doesn't hurt performance wise as we already fetch the user)
    isAllowedOverallAdministratorView := u.isAllowedOverallAdministratorView ?? false,
    isAllowedRefreshDatasetIndex := u.isAllowedRefreshDatasetIndex ?? false,
    isAllowedCreateRelease := u.isAllowedCreateRelease ?? false
}
filter isAllowed
