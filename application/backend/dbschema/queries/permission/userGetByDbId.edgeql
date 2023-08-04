select assert_single(
  (
        select permission::User {
          *
        }
        filter .id = <uuid>$dbId
  )
);
