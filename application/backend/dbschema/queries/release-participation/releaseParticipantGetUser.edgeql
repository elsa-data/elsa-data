# Get user role based on participant user's UUID to its corresponding release

with
  # users are those who have logged in
  u := (
    select permission::User
    filter (
      .releaseParticipant.releaseKey =  <str>$releaseKey 
        and 
      .email = <str>$email
      )
  ),

  # potential users have been mentioned for a release but have not yet logged in
  pu := (
    select permission::PotentialUser
    filter (
      .releaseParticipant.releaseKey =  <str>$releaseKey
        and
      .email = <str>$email
    )
  )

select assert_single(
  (u union pu) {
    id,
    email,
    displayName,
    participation := assert_single(.releaseParticipant { role := @role } filter .releaseKey =  <str>$releaseKey),
    subjectId := [is permission::User].subjectId,
    lastLogin := [is permission::User].lastLoginDateTime
  }
)
