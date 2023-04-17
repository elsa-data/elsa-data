# A get consent query if requested user have permission to view dataset or refresh dataset permission

with
  userPermission := (
    select permission::User
    filter .id = <uuid>$userDbId
  ),

  isAllowedQuery := (
    userPermission.isAllowedRefreshDatasetIndex 
      or 
    userPermission.isAllowedOverallAdministratorView
  ),

select assert_single((
  select consent::Consent {
    id,
    statements : {
      [is consent::ConsentStatementDuo].dataUseLimitation
    }
  }
  filter
    .id = <uuid>$consentDbId
      and
    isAllowedQuery
))
  
