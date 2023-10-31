# Get a release info based on releaseKey
# Potentially could add more properties when needed

select assert_single((
  select release::Release{
    *,
    dataSharingConfiguration: { * }
  }
  filter
    .releaseKey = <str>$releaseKey
))
