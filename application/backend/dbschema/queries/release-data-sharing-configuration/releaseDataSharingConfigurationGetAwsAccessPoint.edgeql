# return the aws access point sharing config for the given release
#

with
  r := (select release::Release { } filter .releaseKey = <str>$releaseKey)

select {
  awsAccessPointEnabled := r.dataSharingConfiguration.awsAccessPointEnabled,
  awsAccessPointName := r.dataSharingConfiguration.awsAccessPointName,
}
