# Update last query timestamp in release record

update release::Release
filter .releaseKey = <str>$releaseKey
set {
  lastDataEgressQueryTimestamp := <datetime>$lastQueryTimestamp
}
