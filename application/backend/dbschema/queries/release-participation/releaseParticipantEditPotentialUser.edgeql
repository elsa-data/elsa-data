
# add a participant to a release that we know is an existing User already
# in the db

update permission::PotentialUser
filter .email = <str>$email
set {
 futureReleaseParticipant += (
    select release::Release { @role := <str>$role } filter .releaseKey = <str>$releaseKey
    )
};
