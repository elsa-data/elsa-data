# Update the `lastUpdated` and `lastUpdatedSubjectId` properties on the release with `releaseKey`.
# Uses the current datetime for `lastUpdated` and a lastUpdatedSubjectId parameter for `lastUpdatedSubjectId`.

update release::Release
filter .releaseKey = <str>$releaseKey
set {
  lastUpdated := datetime_current(),
  lastUpdatedSubjectId := <str>$lastUpdatedSubjectId
}
