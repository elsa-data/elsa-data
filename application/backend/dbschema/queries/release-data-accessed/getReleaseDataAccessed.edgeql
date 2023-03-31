# A simple get query for DataAccessedRecord


select release::DataAccessedRecord{
  releaseCount,
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

     { key: "fileSize", value: "File Size" },
  { key: "releaseCount", value: "Release Count" },
  { key: "description", value: "Description" },
  { key: "sourceIpAddress", value: "Source IP Address" },
  { key: "sourceLocation", value: "Estimate Location" },
  { key: "occurredDateTime", value: "Timestamp" },
  { key: "egressBytes", value: "Bytes Egressed" },