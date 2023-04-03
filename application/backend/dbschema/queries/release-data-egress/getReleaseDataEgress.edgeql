# A simple get query for DataEgressRecord


select release::DataEgressRecord{
  releaseCounter,
  occurredDateTime,
  description,

  sourceIpAddress,
  sourceLocation,
  egressBytes,

  fileUrl,
  fileSize,
}
filter 
    .release.releaseKey = <str>$releaseKey
order by
    .occurredDateTime desc
offset
    <int16>$offset
limit
    <int16>$limit
