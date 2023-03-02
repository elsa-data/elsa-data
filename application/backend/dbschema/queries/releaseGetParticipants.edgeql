# get details of all the participants involved in a given release
# included their role in the release (can be empty), and whether they
# have logged into Elsa Data or not

with
  # users are those who have logged in
  u := (
    select permission::User {
      id,
      subjectId,
      email,
      displayName,
      lastLoginDateTime,
      releaseParticipant: { @role } filter .id = <uuid>$releaseUuid
    } filter .releaseParticipant.id =  <uuid>$releaseUuid),

  # potential users have been mentioned for a release but have not yet logged in
  pu := (
    select permission::PotentialUser {
      id,
      email,
      displayName,
      futureReleaseParticipant: { @role } filter .id = <uuid>$releaseUuid
    } filter .futureReleaseParticipant.id =  <uuid>$releaseUuid)

select
  # merge the users and potential users into a single set
  (u union pu) {
    id,
    email,
    displayName,
    role := assert_single(
          [is permission::User].releaseParticipant@role ??
          [is permission::PotentialUser].futureReleaseParticipant@role),
    subjectId := [is permission::User].subjectId,
    lastLogin := [is permission::User].lastLoginDateTime
  }
