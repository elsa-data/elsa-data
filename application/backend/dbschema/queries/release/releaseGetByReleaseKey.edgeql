# Get a release info based on releaseKey
# Potentially could add more properties when needed

select assert_single((
  select release::Release{
    datasetUris
  }
  filter
    .releaseKey = <str>$releaseKey
))
