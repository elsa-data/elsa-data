select assert_single(
  (
        select permission::User {
          *
        }
        filter .email = <str>$email
  )
)

