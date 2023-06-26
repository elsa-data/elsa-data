with
  r :=  (
          select release::Release {
            userRole := (
                          select .<releaseParticipant[is permission::User] {@role}
                          filter .id = <uuid>$userDbId
                        ),
          }
          # if no userRole then $userDbId is not participating
          filter .releaseKey = <str>$releaseKey
        ),

  isAllowedOverallAdministratorView := (
                                          select permission::User {
                                            isAllowedOverallAdministratorView
                                          }
                                          filter .id = <uuid>$userDbId
                                        ).isAllowedOverallAdministratorView,
  isAllowed := (
    select exists(r.userRole)
    or
    isAllowedOverallAdministratorView
  )

update r
filter isAllowed
set {
    htsgetRestrictions += <str>$restriction
}
