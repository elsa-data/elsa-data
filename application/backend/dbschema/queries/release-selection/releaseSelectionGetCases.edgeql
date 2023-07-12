with
  # the release we are looking at
  release := assert_single((select release::Release filter .releaseKey =  <str>$releaseKey)),

  # the datasets of the release
  datasets := (select dataset::Dataset filter .uri in array_unpack(release.datasetUris)),

  isAllowedViewAllCases := <bool>$isAllowedViewAllCases,

  # cases
  cases := (select dataset::DatasetCase {
      *,
      consent: {
        id,
      },
      dataset: {
        *
      },
      patients: {
        *,
        consent: { },
        specimens: {
          *,
          consent: { },
          isSelected := .id in release.selectedSpecimens.id
        } filter (isAllowedViewAllCases OR
               .id in release.selectedSpecimens.id)
      } filter (isAllowedViewAllCases OR
               .specimens in release.selectedSpecimens)
    }
    filter
            ( not exists(<optional str>$q) OR  contains ( {
                str_upper(array_unpack(.externalIdentifiers).value),
                str_upper(array_unpack(.patients.externalIdentifiers).value),
                str_upper(array_unpack(.patients.specimens.externalIdentifiers).value)

              } , <optional str>$q) )
            AND
            .dataset in datasets AND
             (isAllowedViewAllCases OR
              .patients.specimens in release.selectedSpecimens)
  ),

select {
  total := count(cases),
  totalSelectedSpecimens := count(release.selectedSpecimens),
  totalSpecimens := count(cases.patients.specimens),
  data := (
      select (cases) {
        *,
        patients: { *, specimens: { * }},
        dataset: { * }
      }
      order by
        .dataset.uri ASC then .id ASC
      offset
       <optional int64>$offset
      limit
       <optional int64>$limit
  )
}
