select assert_single(
  (
    select permission::User {
      *
    }
    filter .subjectId = <str>$subjectId
  )
)

