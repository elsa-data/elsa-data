# Get a single release key by its database id. The database id must exist otherwise
# an error is thrown.

select assert_exists(assert_single(
  (
        select release::Release {
            releaseKey
        }
        filter .id = <uuid>$dbId
  )
));
