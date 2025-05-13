# Get a release info with some nested details based on releaseKey

select assert_single((
  select release::Release{
    *,
    dataSharingConfiguration: { * },
    applicationCoded: { * },
    runningJob: { * },
    activation: { * }
  }
  filter
    .releaseKey = <str>$releaseKey
))
