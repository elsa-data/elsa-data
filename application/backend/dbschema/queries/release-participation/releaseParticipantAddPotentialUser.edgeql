# add a participant to a release where the person has not yet
# logged into the db BUT DOES EXIST AS A POTENTIAL USER

update permission::PotentialUser
filter .id = <uuid>$potentialUserUuid
set {
 futureReleaseParticipant += (
    select release::Release { @role := <str>$role } filter .releaseIdentifier = <str>$releaseId
    )
};
