# A dataset summary query via edgeql.
# Create a dataset summary by URI

with

  userPermission := (
    select permission::User
    filter .id = <uuid>$userDbId
  ),

  isAllowedQuery := (
    userPermission.isAllowedRefreshDatasetIndex 
      or 
    userPermission.isAllowedOverallAdministratorView
  ),

select assert_single((
  select dataset::Dataset {
    uri := .uri,
    description := .description,
    updatedDateTime := .updatedDateTime,
    isInConfig := .isInConfig,

    cases := (
      select .cases { 
        consent: { 
          id,
        },
        externalIdentifiers,
        patients: {
          sexAtBirth,
          consent : { 
            id,
          },
          externalIdentifiers,
        }
      }
    ),

    totalCaseCount := count(.cases),
    totalPatientCount := count(.cases.patients),
    totalSpecimenCount := count(.cases.patients.specimens),

  }
  filter
    .uri = <str>$datasetUri
      and
    isAllowedQuery
))
