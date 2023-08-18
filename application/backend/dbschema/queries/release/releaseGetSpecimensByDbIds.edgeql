# A query to find specimen ids for a release - but respecting the tree structure
# of the datasets. So this can be passed in ids from any dataset node (cases, patients,
# specimens) and it will return a list of contained specimens (with extra error checking to
# avoid cross-linking and invalid ids)

WITH
  # the release key
  paramReleaseKey := <str>$releaseKey,

  # a list of db ids (from either cases, patients or specimens)
  paramDbIds := array_unpack(<array<uuid>>$dbids),

  #######

  # the release we are looking at
  release := assert_single((SELECT release::Release FILTER .releaseKey = paramReleaseKey)),

  # the datasets of the release
  datasets := (SELECT dataset::Dataset FILTER .uri IN array_unpack(release.datasetUris)),

  # select any passed in db ids that match a specimen db id that is from the release dataset(s)
  specimensFromDatasets := (SELECT dataset::DatasetSpecimen FILTER .dataset IN datasets AND .id IN paramDbIds),

  # select any passed in db ids that match a patient db id that is from the release dataset(s)
  patientsFromDatasets := (SELECT dataset::DatasetPatient FILTER .dataset IN datasets AND .id IN paramDbIds),

  # select any passed in db ids that match a case db id that is from the release dataset(s)
  casesFromDatasets := (SELECT dataset::DatasetCase FILTER .dataset IN datasets AND .id IN paramDbIds),

  # for error checking purposes - select out any passed in db ids that match
  # a specimen/patient/case but one that is NOT from the release dataset
  specimensNotFromDatasets := (SELECT dataset::DatasetSpecimen FILTER .dataset NOT IN datasets AND
                                                                      .id IN paramDbIds),
  patientsNotFromDatasets := (SELECT dataset::DatasetPatient FILTER .dataset NOT IN datasets AND
                                                                      .id IN paramDbIds),
  casesNotFromDatasets := (SELECT dataset::DatasetCase FILTER .dataset NOT IN datasets AND
                                                              .id IN paramDbIds),

  # for error checking purposes - select out any passed in dbs ids that don't seem to be a db id at all
  # (that is, they are syntactically a db id, just not from one of the objects we want in this db)
  dbIdsNotValid := (SELECT paramDbIds FILTER paramDbIds NOT IN dataset::DatasetSpecimen.id AND
                                             paramDbIds NOT IN dataset::DatasetPatient.id AND
                                             paramDbIds NOT IN dataset::DatasetCase.id),

SELECT {
  invalidDbIds := (SELECT dbIdsNotValid),

  crossLinkedSpecimenCount := count(specimensNotFromDatasets),
  crossLinkedPatientCount := count(patientsNotFromDatasets),
  crossLinkedCaseCount := count(casesNotFromDatasets),

  specimens := DISTINCT (SELECT casesFromDatasets.patients.specimens UNION
                                patientsFromDatasets.specimens UNION
                                specimensFromDatasets)
}

