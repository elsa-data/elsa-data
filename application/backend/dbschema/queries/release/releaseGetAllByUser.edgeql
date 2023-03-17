# get light details of all the releases that the given user is involved with
# this query supports paging

with

  # isAllowedElsaAdminView is for admin who has access to view all releases
  isAllowedElsaAdminView := (
                          select permission::User {
                            isAllowedElsaAdminView
                          }
                          filter .id = <uuid>$userDbId
                        ).isAllowedElsaAdminView,  

  # r is the set of all releases that involve $userDbId as a participant
  r := (
          select release::Release {
            userRole := (select .<releaseParticipant[is permission::User] {@role}
                          filter .id = <uuid>$userDbId),
          }
          # if no userRole then $userDbId is not participating
          filter isAllowedElsaAdminView or exists(.userRole)
          order by .lastUpdated desc
        )

select {
  total := count(r),
  data := (select r
           {
              releaseKey,
              lastUpdated,
              datasetUris,
              applicationDacTitle,
              applicationDacIdentifier,
              role := (select assert_single(.userRole@role)),
              runningJob: {
                # we are avoiding fetching the message/details etc (which could be large) in this summary
                id,
                percentDone,
              },
              activation: {
                # we are avoiding fetching the manifest etc (which could be large) in this summary
                id,
              },
           }
           offset <optional int64>$offset
           limit  <optional int64>$limit)
}
