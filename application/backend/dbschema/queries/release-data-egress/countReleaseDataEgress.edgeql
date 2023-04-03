# a simple count how much the DataEgressRecord record exist for given releaseKey

select(
  count((
    select release::DataEgressRecord{} 
    filter .release.releaseKey =<str>$releaseKey
  ))
)
