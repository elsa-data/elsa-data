# Get user role based on participant user's UUID to its corresponding release

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
    filter (
      .releaseParticipant.releaseKey =  <str>$releaseKey 
        and 
      .email = <str>$email
      )
  ),

  # potential users have been mentioned for a release but have not yet logged in
  pu := (
    select permission::PotentialUser {
      id,
      email,
      displayName,
      futureReleaseParticipant: { @role } filter .releaseKey = <str>$releaseKey
    } 
    filter (
      .futureReleaseParticipant.releaseKey =  <str>$releaseKey
        and
      .email = <str>$email
    )
  )

select assert_single(
  (u union pu) {
    id,
    email,
    displayName,
    role := assert_single([is permission::User].releaseParticipant@role) ??
            assert_single([is permission::PotentialUser].futureReleaseParticipant@role),
    subjectId := [is permission::User].subjectId,
    lastLogin := [is permission::User].lastLoginDateTime
  }
)
