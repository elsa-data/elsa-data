# remove participation to a release that we know is an existing User already
# in the db

select assert_single((
    update permission::User
    filter .email = <str>$email
    set {
    releaseParticipant -= (
        select release::Release filter .releaseKey = <str>$releaseKey
        )
    }
));
