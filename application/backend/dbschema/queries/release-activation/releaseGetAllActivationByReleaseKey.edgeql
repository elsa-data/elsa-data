# This query will eventually query all release::Activation by releaseKey
# Expand if need be to return a more thorough result 

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

  allActivation := currReleaseActivation union prevReleaseActivation,

  accessPointArns := (select distinct(
    for a in allActivation
    union (
     array_unpack(a.accessPointArns)
    )
  )),

  
select {
  accessPointArns:=accessPointArns
};
