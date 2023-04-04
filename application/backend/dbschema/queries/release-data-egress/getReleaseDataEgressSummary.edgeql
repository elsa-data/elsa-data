# A query that summarize egress size groped by file level.

with

  # Select all files related with this release
  bclFile := (
    select storage::File{
      url,
      size
    }
    filter
      .<bclFile[is lab::ArtifactBcl]
      .<artifacts[is dataset::DatasetSpecimen]
      .<selectedSpecimens[is release::Release]
      .releaseKey = <str>$releaseKey
  ),

  fastqForwardFile := (
    select storage::File{
      url,
      size
    }
    filter
      .<forwardFile[is lab::ArtifactFastqPair]
      .<artifacts[is dataset::DatasetSpecimen]
      .<selectedSpecimens[is release::Release]
      .releaseKey = <str>$releaseKey
  ),
  fastqReverseFile := (
    select storage::File{
      url,
      size
    }
    filter
      .<reverseFile[is lab::ArtifactFastqPair]
      .<artifacts[is dataset::DatasetSpecimen]
      .<selectedSpecimens[is release::Release]
      .releaseKey = <str>$releaseKey
  ),

  vcfFile := (
    select storage::File{
      url,
      size
    }
    filter
      .<vcfFile[is lab::ArtifactVcf]
      .<artifacts[is dataset::DatasetSpecimen]
      .<selectedSpecimens[is release::Release]
      .releaseKey = <str>$releaseKey
  ),
  tbiFile := (
    select storage::File{
      url,
      size
    }
    filter
      .<tbiFile[is lab::ArtifactVcf]
      .<artifacts[is dataset::DatasetSpecimen]
      .<selectedSpecimens[is release::Release]
      .releaseKey = <str>$releaseKey
  ),

  bamFile := (
    select storage::File{
      url,
      size
    }
    filter
      .<bamFile[is lab::ArtifactBam]
      .<artifacts[is dataset::DatasetSpecimen]
      .<selectedSpecimens[is release::Release]
      .releaseKey = <str>$releaseKey
  ),
  baiFile := (
    select storage::File{
      url,
      size
    }
    filter
      .<baiFile[is lab::ArtifactBam]
      .<artifacts[is dataset::DatasetSpecimen]
      .<selectedSpecimens[is release::Release]
      .releaseKey = <str>$releaseKey
  ),
  
  cramFile := (
    select storage::File{
      url,
      size
    }
    filter
      .<cramFile[is lab::ArtifactCram]
      .<artifacts[is dataset::DatasetSpecimen]
      .<selectedSpecimens[is release::Release]
      .releaseKey = <str>$releaseKey
  ),
  craiFile := (
    select storage::File{
      url,
      size
    }
    filter
      .<craiFile[is lab::ArtifactCram]
      .<artifacts[is dataset::DatasetSpecimen]
      .<selectedSpecimens[is release::Release]
      .releaseKey = <str>$releaseKey
  ),

  allFiles := (
    bclFile 
    union fastqForwardFile 
    union fastqReverseFile 
    union vcfFile 
    union tbiFile
    union bamFile 
    union baiFile
    union cramFile 
    union craiFile
  ),

  fileCount := count(allFiles),

select {
  results := (
    select (
      for file in allFiles
      union (
        with
          dataEgressRecord := ( 
            select release::DataEgressRecord { egressBytes, occurredDateTime }
            filter .release.releaseKey = <str>$releaseKey and .fileUrl = file.url
            order by .occurredDateTime
          )

        select {
          fileUrl := file.url,
          fileSize := file.size,
          totalDataEgressInBytes := sum((
            dataEgressRecord.egressBytes
          )),
          lastOccurredDateTime := (select assert_single((select dataEgressRecord.occurredDateTime limit 1)))
        }
      )
    )
    order by
        .totalDataEgressInBytes desc
    offset
        <int16>$offset
    limit
        <int16>$limit
  ),
  totalCount := fileCount
}
