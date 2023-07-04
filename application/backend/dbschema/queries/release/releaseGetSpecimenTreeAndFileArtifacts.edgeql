# a query to return an almost complete dump of the data from datasets
# (both tree structure and artifact files) but respecting the 'selectedSpecimens'
# restriction from the passed in `releaseKey`.

# NOTE: the files output requires further processing to unwind the
# slightly messy modelling ie. vcfFile v cramFile

# NOTE: the intention of this query is mainly for generating (occasional) file manifests
# so is more comprehensive rather than high performance

with
  # some basic fields from the db for the given release
  release := (select release::Release {
    isAllowedReadData,
    isAllowedVariantData,
    isAllowedS3Data,
    isAllowedGSData,
    isAllowedR2Data,
    dataSharingConfiguration
  }
  filter .releaseKey = <str>$releaseKey),

  # we are only interested in those specimens selected for the given release
  selected := release.selectedSpecimens

select {
  # a useful snapshot of the point in time database state of some fields that go into
  # our manifest construction

  releaseDbId := release.id,
  releaseKey := <str>$releaseKey,
  releaseIsAllowedReadData := release.isAllowedReadData,
  releaseIsAllowedVariantData:= release.isAllowedVariantData,
  releaseIsAllowedS3Data:= release.isAllowedS3Data,
  releaseIsAllowedGSData:= release.isAllowedGSData,
  releaseIsAllowedR2Data := release.isAllowedR2Data,
  releaseHtsgetRestrictions := release.dataSharingConfiguration.htsgetRestrictions,

  # the tree is an output representation with all the dataset level
  # fields (sexAtBirth etc) and retaining the hierarchical nature of the data

  # the tree is filtered such that cases/patients nodes are only returned
  # where there are leaves (i.e. specimens) present
  caseTree := (select dataset::DatasetCase {
              externalIdentifiers,
              dataset: {
                id,
                uri
              },
              patients: {
                id,
                externalIdentifiers,
                sexAtBirth,
                specimens: {
                  id,
                  externalIdentifiers,
                  sampleType
                }
                filter dataset::DatasetSpecimen in selected
              }
              # this filter is needed otherwise we end up with 'empty' patients
              filter .specimens in selected,
           }
           # this filter is needed otherwise we end up with 'empty' cases
           filter .patients.specimens in selected

           # the order is not particularly important but we would like it
           # to be at least somewhat stable
           order by .dataset.uri ASC then .id ASC
        ),

  # the files is a raw dump of all the specimens and their accompanying artifact files
  # with just enough linkage to find them in the above tree if needed

  specimenList := (select dataset::DatasetSpecimen {
              id,
              externalIdentifiers,
              patient: {
                id,
                externalIdentifiers
              },
              case_: {
                id,
                externalIdentifiers
              },
              dataset: {
                id,
                externalIdentifiers
              },
              artifacts: {
                id,
                [is lab::ArtifactBcl].bclFile: { url, size, checksums },
                [is lab::ArtifactFastqPair].forwardFile: { url, size, checksums },
                [is lab::ArtifactFastqPair].reverseFile: { url, size, checksums },
                [is lab::ArtifactBam].bamFile: { url, size, checksums },
                [is lab::ArtifactBam].baiFile: { url, size, checksums },
                [is lab::ArtifactCram].cramFile: { url, size, checksums },
                [is lab::ArtifactCram].craiFile: { url, size, checksums },
                [is lab::ArtifactVcf].vcfFile: { url, size, checksums },
                [is lab::ArtifactVcf].tbiFile: { url, size, checksums }
              }
            }
            filter dataset::DatasetSpecimen in selected
          )
}
