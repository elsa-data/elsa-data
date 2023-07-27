# A query that summarize egress size groped by file level.

with

  # There are 2 scenarios where the list of files could come from:
  # (1) From a manifest file that WAS activated
  # (2) From a manifest file that IS activated

  # (1)
  prevReleaseActivation := (
    select release::Activation
    filter 
      .<previouslyActivated[is release::Release]
      .releaseKey = <str>$releaseKey
  ),

  prevSpecimenList := json_get(
    (select prevReleaseActivation).manifest,
    "specimenList"
  ),

  prevArtifacts := (select distinct(
    for s in json_array_unpack(prevSpecimenList)
    union (
      select json_get(s, 'artifacts')
    )
  )),

  prevFileObjectJson  := (select distinct(
    for a in json_array_unpack(prevArtifacts)
    union (
      select {
        json_get(a, 'bclFile'),
        json_get(a, 'forwardFile'),
        json_get(a, 'reverseFile'),
        json_get(a, 'bamFile'),
        json_get(a, 'baiFile'),
        json_get(a, 'cramFile'),
        json_get(a, 'craiFile'),
        json_get(a, 'vcfFile'),
        json_get(a, 'tbiFile')
      }
    )
  )),

  # (2)
  currReleaseActivation := (
    select release::Activation
    filter 
      .<activation[is release::Release]
      .releaseKey = <str>$releaseKey
  ),

  currSpecimenList := json_get(
    (select currReleaseActivation).manifest,
    "specimenList"
  ),

  currArtifacts := (select distinct(
    for s in json_array_unpack(currSpecimenList)
    union (
      select json_get(s, 'artifacts')
    )
  )),

  currFileObjectJson := (select distinct(
    for a in json_array_unpack(currArtifacts)
    union (
      select {
        json_get(a, 'bclFile'),
        json_get(a, 'forwardFile'),
        json_get(a, 'reverseFile'),
        json_get(a, 'bamFile'),
        json_get(a, 'baiFile'),
        json_get(a, 'cramFile'),
        json_get(a, 'craiFile'),
        json_get(a, 'vcfFile'),
        json_get(a, 'tbiFile')
      }
    )
  )),

  currFileUrl := ( for jsonFile in currFileObjectJson union (select <str>json_get(jsonFile, 'url'))),

  # Merging this for the purpose of summary
  allFileObjectJson := (select distinct prevFileObjectJson union currFileObjectJson),
  fileCount := count(allFileObjectJson),

select {
  data := assert_distinct((
    select (
      for jsonFile in allFileObjectJson
      union (
        with

          fileUrl := <str>json_get(jsonFile, 'url'),
          fileSize := <int64>json_get(jsonFile, 'size'),

          dataEgressRecord := ( 
            select release::DataEgressRecord
            filter 
                .release.releaseKey = <str>$releaseKey 
              and 
                .fileUrl = fileUrl
            order by 
              .occurredDateTime desc
          )

        select {
          fileUrl := fileUrl,
          fileSize := fileSize,
          totalDataEgressInBytes := sum((
            dataEgressRecord.egressBytes
          )),
          lastOccurredDateTime := (
              select assert_single((select dataEgressRecord.occurredDateTime limit 1))
          ),
          isActive := fileUrl in currFileUrl,
        }
      )
    )
    order by
        .fileUrl asc
    offset
       <optional int64>$offset
    limit
       <optional int64>$limit
  )),
  total := fileCount
}
