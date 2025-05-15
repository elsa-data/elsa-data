select assert_single(
  (
    select permission::PotentialUser {
      # note we use the ** splat because we want to know the releaseParticipant data too
      **
    }
    filter .email = <str>$email
  )
)

