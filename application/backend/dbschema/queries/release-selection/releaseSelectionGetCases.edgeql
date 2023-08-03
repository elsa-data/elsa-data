# returns a pageable set of "cases" from the given release - where those cases contain
# any case where a child specimen is selected - or alternatively can
# work to return all "cases"

WITH
  # the release key
  paramReleaseKey := <str>$releaseKey,

  # if true then this query should return all the cases, otherwise only those containing selected specimens
  paramIsAllowedViewAllCases := <bool>$isAllowedViewAllCases,

  # if present, a string that must match a case/patient/specimen identifier (case insensitive)
  # in order that the case is returned
  paramQuery := <optional str>$query,

  # if present, use as a paging offset
  paramOffset := <optional int64>$offset,

  # if present, use as a paging limit
  paramLimit := <optional int64>$limit,

  #######

  # the release we are looking at
  release := assert_single((SELECT release::Release FILTER .releaseKey = paramReleaseKey)),

  # the datasets of the release
  datasets := (SELECT dataset::Dataset FILTER .uri IN array_unpack(release.datasetUris)),

  # cases
  cases := (
    SELECT dataset::DatasetCase {
      dataset: {
        consent: { },
      },
      consent: { },
      patients: {
        consent: { },
        specimens: {
          consent: { },
          isSelected := .id IN release.selectedSpecimens.id
        } FILTER (paramIsAllowedViewAllCases OR .id IN release.selectedSpecimens.id)
      } FILTER (paramIsAllowedViewAllCases OR .specimens IN release.selectedSpecimens)
    }
    FILTER
      .dataset IN datasets
      AND
      (paramIsAllowedViewAllCases OR .patients.specimens IN release.selectedSpecimens)
      AND
      (
        # if we are doing a text search and we want to find those identifiers using query IN
        # else
        # our IN query will fail when 'paramQuery' is not present - and that means we want just return true (i.e success)
        (paramQuery IN
           (array_unpack(.externalIdentifiers).value UNION
            array_unpack(.patients.externalIdentifiers).value UNION
            array_unpack(.patients.specimens.externalIdentifiers).value)) ?? true
      )
  ),

SELECT {
  total := count(cases),
  totalSelectedSpecimens := count(release.selectedSpecimens),
  totalSpecimens := count(cases.patients.specimens),
  data := (
      SELECT cases {
        *,
        dataset: { *,
                   consent: { * } },
        consent: { * },
        patients: { *,
                    consent: { * },
                    specimens: { *,
                                 consent: { * }
                               }
                  },
      }
      ORDER BY
        .dataset.uri ASC THEN
        .id ASC
      OFFSET
        paramOffset
      LIMIT
        paramLimit
  )
}
