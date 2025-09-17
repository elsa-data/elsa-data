# Update a dataset with new cases and update timestamp
# Used after creating all cases to link them to the dataset

update dataset::Dataset
filter .uri = <str>$datasetUri
set {
  cases := <dataset::DatasetCase>$cases,
  updatedDateTime := datetime_current()
}