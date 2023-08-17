# a query to ensure that the given specimen ids for the given release
# are indeed specimens that are from datasets of the release
# (prevents cross linking)
# NOTE that if no specimen ids are passed in this
# effectively returns all the associated specimens from all dataset in the release
# (this was an easy spot to put in "Select All" functionality)

WITH
  datasetsInRelease := (
    SELECT release::Release {
        links := (
          SELECT dataset::Dataset
          FILTER .uri IN array_unpack(release::Release.datasetUris)
        )
      }
    FILTER .releaseKey = <str>$releaseKey
  ).links,

  allInternalIdentifiers := (
    SELECT array_agg(
      (
        SELECT dataset::DatasetSpecimen {
          idStr := <str>.id
        }
        FILTER .dataset IN datasetsInRelease
      ).idStr
    )
  ),

  identifiers := (
    allInternalIdentifiers
    if (<array<str>>$identifiers = <array<str>>[])
    else <array<str>>$identifiers
  ),

  unconcatenatedSpecimenIdsByIdentifier := (
    FOR identifier IN array_unpack(identifiers)
    UNION (
      SELECT {
        identifier := identifier,

        specimenIdsByExternalSpecimenId := (
          SELECT array_agg(
            (
              SELECT dataset::DatasetSpecimen
              # TODO: Index
              FILTER contains(
                .externalIdentifiers,
                (system := '', value := identifier)
              )
            ).id
          )
        ),

        specimenIdsByExternalPatientId := (
          SELECT array_agg(
            (
              SELECT dataset::DatasetPatient
              # TODO: Index
              FILTER contains(
                .externalIdentifiers,
                (system := '', value := identifier)
              )
            ).specimens.id
          )
        ),

        specimenIdsByInternalSpecimenId := (
          SELECT array_agg(
            (
              SELECT dataset::DatasetSpecimen
              # TODO: Index
              FILTER <str>.id = identifier
            ).id
          )
        ),

        specimenIdsByInternalPatientId := (
          SELECT array_agg(
            (
              SELECT dataset::DatasetPatient
              # TODO: Index
              FILTER <str>.id = identifier
            ).specimens.id
          )
        ),
      }
    )
  ),

  concatenatedSpecimenIdsByIdentifier := (
    FOR unconcatenatedSpecimenIdByIdentifier IN unconcatenatedSpecimenIdsByIdentifier
    UNION (
      SELECT {
        identifier := unconcatenatedSpecimenIdByIdentifier.identifier,
        internalIdentifiers := (
          unconcatenatedSpecimenIdByIdentifier.specimenIdsByExternalSpecimenId ++
          unconcatenatedSpecimenIdByIdentifier.specimenIdsByExternalPatientId ++
          unconcatenatedSpecimenIdByIdentifier.specimenIdsByInternalSpecimenId ++
          unconcatenatedSpecimenIdByIdentifier.specimenIdsByInternalPatientId
        )
      }
    )
  ),

  specimenIds := (
    FOR concatenatedSpecimenIdsByIdentifier IN concatenatedSpecimenIdsByIdentifier
    UNION (
      SELECT {
        identifier := concatenatedSpecimenIdsByIdentifier.identifier,
        internalIdentifiers := concatenatedSpecimenIdsByIdentifier.internalIdentifiers,
        hasCrossLink := (
          SELECT EXISTS (
            SELECT dataset::DatasetSpecimen
            FILTER
              .dataset NOT IN datasetsInRelease AND
              contains(concatenatedSpecimenIdsByIdentifier.internalIdentifiers, .id)
          )
        )
      }
    )
  )

SELECT specimenIds { * };
