# check if the isAllowedHtsget permission is true for a release
select release::Release {
    isActivated := (
        select exists .activation
    )
}
filter .releaseKey = <str>$releaseKey;
