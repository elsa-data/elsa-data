# A query that summarize egress size groped by file level.

with

  prevReleaseActivation := (
    select release::Activation
    filter 
      .<previouslyActivated[is release::Release]
      .releaseKey = <str>$releaseKey
  ),

  activeReleaseActivation := (
    select release::Activation
    filter 
      .<activation[is release::Release]
      .releaseKey = <str>$releaseKey

  ),

  allActivation := (
    prevReleaseActivation union activeReleaseActivation
  ),

  specimenList := json_get(
    (select allActivation).manifest,
    "specimenList"
  ),

  artifacts := (select distinct(
    for s in json_array_unpack(specimenList)
    union (
      select json_get(s, 'artifacts')
    )
  )),

  fileObjectJson := (select distinct(
    for a in json_array_unpack(artifacts)
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

  fileCount := count(fileObjectJson),

select {
  data := assert_distinct((
    select (
      for jsonFile in fileObjectJson
      union (
        with
          dataEgressRecord := ( 
            select release::DataEgressRecord
            filter 
                .release.releaseKey = <str>$releaseKey 
              and 
                .fileUrl = <str>json_get(jsonFile, 'url')
            order by 
              .occurredDateTime desc
          )

        select {
          fileUrl := <str>json_get(jsonFile, 'url'),
          fileSize := <int64>json_get(jsonFile, 'size'),
          totalDataEgressInBytes := sum((
            dataEgressRecord.egressBytes
          )),
          lastOccurredDateTime := (
              select assert_single((select dataEgressRecord.occurredDateTime limit 1))
          )
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
