# get details of all the participants involved in a given release
# included their role in the release (can be empty), and whether they
# have logged into Elsa Data or not

# this query has no filtering or paging as the expectation is that
# the list of users participating in any given release is self-limiting
# to a handful of people (10+ would be abnormal) - obviously this
# decision needs to be revisited if that expectation is wrong

with
  # users are those who have logged in
  u := (
    select permission::User {
      id,
      subjectId,
      email,
      displayName,
      lastLoginDateTime,
      releaseParticipant: { @role } filter .releaseKey = <str>$releaseKey
    } 
    filter .releaseParticipant.releaseKey =  <str>$releaseKey),

  # potential users have been mentioned for a release but have not yet logged in
  pu := (
    select permission::PotentialUser {
      id,
      email,
      displayName,
      futureReleaseParticipant: { @role } filter .releaseKey = <str>$releaseKey
    } 
    filter .futureReleaseParticipant.releaseKey =  <str>$releaseKey),

  participants := (u union pu)

select {
  total := count(participants),
  data := (
      select (participants) {
        id,
        email,
        displayName,
        role := assert_single([is permission::User].releaseParticipant@role) ??
                assert_single([is permission::PotentialUser].futureReleaseParticipant@role),
        subjectId := [is permission::User].subjectId,
        lastLogin := [is permission::User].lastLoginDateTime
      }
      order by
        .role
      offset
        <int16>$offset
      limit
        <int16>$limit
  )
}
