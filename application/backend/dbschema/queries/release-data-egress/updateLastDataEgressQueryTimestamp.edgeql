# Update last query timestamp in release record

update release::Release
filter .releaseKey = <str>$releaseKey
set {
  lastDataAccessQueryTimestamp := <datetime>$lastQueryTimestamp
}
