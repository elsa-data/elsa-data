# Get all datasets (with pagination) when accessing user is allowed to do so

with

  dataset := (
    select dataset::Dataset
  )

select {
  data := (
    select dataset {
      uri,
      description,
      updatedDateTime,
      isInConfig,
      totalCaseCount := count(.cases),
      totalPatientCount := count(.cases.patients),
      totalSpecimenCount := count(.cases.patients.specimens),
    }
    order by
        .isInConfig desc 
          then 
        .updatedDateTime desc
          then 
        .uri desc
    offset
       <optional int64>$offset
    limit
       <optional int64>$limit
  ),
  total := count(dataset)
}
