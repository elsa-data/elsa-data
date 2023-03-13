# a query to ensure that the given specimen ids for the given release
# are indeed specimens that are from datasets of the release
# (prevents cross linking)
# NOTE that if no specimen ids are passed in this
# effectively returns all the associated specimens from all dataset in the release
# (this was an easy spot to put in "Select All" functionality)

with
  # the set of Datasets associated with the given release linked via the dataset URI
  datasets := (select release::Release {
                  links := (select dataset::Dataset
                             filter .uri in array_unpack(release::Release.datasetUris))
                }
                filter .releaseKey = <str>$releaseKey
              )
              .links,

  # the specimens are either a set of ids passed in OR all the specimens from our datasets
  # (this helps enable the 'select all' functionality)
  specimens := array_unpack(<optional array<uuid>>$specimenIds) ??
                  (select dataset::DatasetSpecimen filter .dataset in datasets).id


select {
  valid := (select dataset::DatasetSpecimen filter .dataset in datasets AND .id in specimens),
  crossLinked := (select dataset::DatasetSpecimen filter .dataset not in datasets AND .id in specimens)
}
