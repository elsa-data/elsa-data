# add a participant to a release that we know is an existing User already
# in the db

update permission::User
filter .id = <uuid>$userUuid
set {
 releaseParticipant += (
    select release::Release { @role := <str>$role } filter .releaseKey = <str>$releaseKey
    )
};
