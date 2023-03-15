select assert_single((
  select release::Release {
    releaseKey
  }
  filter .releaseAuditLog.id = <uuid>$releaseAuditEventId
))
