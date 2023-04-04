# check if the isAllowedHtsget permission is true for a release
select release::Release {
    isAllowedHtsget
}
filter .releaseKey = <str>$releaseKey;
