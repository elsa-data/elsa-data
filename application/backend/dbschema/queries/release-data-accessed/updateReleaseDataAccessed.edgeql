# Insert a new DataAccessedRecord to the relevant release record

update release::Release
filter .releaseKey = <str>$releaseKey
set {
  dataAccessedRecord += (
    insert release::DataAccessedRecord{

      releaseCount := <int32>$releaseCount,
      occurredDateTime := <datetime>$occurredDateTime,
      description := <str>$description,

      sourceIpAddress := <str>$sourceIpAddress,
      sourceLocation := <str>$sourceLocation,
      egressBytes := <int64>$egressBytes,

      fileUrl := <str>$fileUrl,
      fileSize := (
        select assert_single((
            select storage::File{size}
            filter .url = <str>$fileUrl
        )).size
      ),
    }
  )
}