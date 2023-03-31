# a simple count how much the DataAccessedRecord record exist for given releaseKey

select(
  count((
    select release::DataAccessedRecord{} 
    filter .release.releaseKey =<str>$releaseKey
  ))
)