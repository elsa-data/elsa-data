# get details of all the participants involved in a given release
# included their role in the release (can be empty), and whether they
# have logged into Elsa Data or not

with
  # users are those who have logged in
  u := (
    select permission::User filter .releaseParticipant.releaseKey =  <str>$releaseKey
    ),

  # potential users have been mentioned for a release but have not yet logged in
  pu := (
    select permission::PotentialUser filter .releaseParticipant.releaseKey =  <str>$releaseKey
    ),

  participants := (u union pu)

select {
  total := count(participants),
  data := (
      select (participants) {
        id,
        email,
        displayName,
        participation := assert_single(.releaseParticipant { role := @role } filter .releaseKey =  <str>$releaseKey),
        subjectId := [is permission::User].subjectId,
        lastLogin := [is permission::User].lastLoginDateTime
      }
      order by
        .email
      offset
       <optional int64>$offset
      limit
       <optional int64>$limit
  )
}
