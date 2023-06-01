# Get the most recent audit events according to a date and releaseKey.
# Uses `.updatedDateTime` because this property is indexed.
select audit::ReleaseAuditEvent {
  updatedDateTime,
  whoId,
  release_
} 
filter .whoId = <str>$whoId 
  and .updatedDateTime >= <datetime>$since 
  and .release_.releaseKey = <str>$releaseKey
order by .updatedDateTime desc;