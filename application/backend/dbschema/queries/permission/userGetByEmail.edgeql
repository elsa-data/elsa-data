select assert_single(
  (
        select permission::User {
          *
        }
        filter str_lower(.email) = str_lower(<str>$email)
  )
)

