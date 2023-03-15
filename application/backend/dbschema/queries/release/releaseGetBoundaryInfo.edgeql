# a light as possible query that can be executed on the boundary
# of any interaction with a single release
# returns just enough information including what role the given user
# plays in the release, whether release is locked and the fact the releaseKey
# is valid (given it may have come from an untrusted source - the fact that
# anything is returned validates the releaseKey)


with 

  r := (
        select release::Release {
          userRole := (
                        select .<releaseParticipant[is permission::User] {@role}
                        filter .id = <uuid>$userDbId
                      ),
        }
        # if no userRole then $userDbId is not participating
        filter .releaseKey = <str>$releaseKey
       )

select r {
    runningJob,
    activation,
    role := (select assert_single(.userRole@role))
}
