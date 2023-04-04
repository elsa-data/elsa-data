# Insert a new DataEgressRecord to the relevant release record

update release::Release
filter .releaseKey = <str>$releaseKey
set {
  dataEgressRecord += (
    insert release::DataEgressRecord{

      auditId := <str>$auditId,
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
