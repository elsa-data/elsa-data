# remove participation to a release that we know is an existing PotentialUser already
# in the db

select assert_single((
    update permission::PotentialUser
    filter .email = <str>$email
    set {
    futureReleaseParticipant -= (
        select release::Release filter .releaseKey = <str>$releaseKey
        )
}
));
