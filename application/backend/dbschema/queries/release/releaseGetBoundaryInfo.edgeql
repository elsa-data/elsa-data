# a light as possible query that can be executed on the boundary
# of any interaction with a single release
# returns just enough information including what role the given user
# plays in the release, whether release is locked and the fact the releaseKey
# is valid (given it may have come from an untrusted source - the fact that
# anything is returned validates the releaseKey)

select release::Release {
    runningJob,
    activation,
    role := (select .<releaseParticipant[is permission::User] {@role}
             filter .id = <uuid>$userDbId)
}
filter .releaseKey = <str>$releaseKey
