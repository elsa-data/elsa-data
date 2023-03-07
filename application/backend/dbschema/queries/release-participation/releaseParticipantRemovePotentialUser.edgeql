# remove participation to a release that we know is an existing PotentialUser already
# in the db

update permission::PotentialUser
filter .id = <uuid>$potentialUserUuid
set {
 futureReleaseParticipant -= (
    select release::Release filter .releaseIdentifier = <str>$releaseId
    )
};
