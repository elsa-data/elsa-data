# This query will eventually query all release::Activation by releaseKey

with

  currReleaseActivation := (
    select release::Activation
    filter 
      .<activation[is release::Release]
      .releaseKey = <str>$releaseKey
  ),
  prevReleaseActivation := (
    select release::Activation
    filter 
      .<previouslyActivated[is release::Release]
      .releaseKey = <str>$releaseKey
  ),

  allActivation := currReleaseActivation union prevReleaseActivation

