select assert_single(
  (
    select permission::PotentialUser {
      # note we use the ** splat because we want to know the futureReleaseParticipant data too
      **
    }
    filter .email = <str>$email
  )
)

