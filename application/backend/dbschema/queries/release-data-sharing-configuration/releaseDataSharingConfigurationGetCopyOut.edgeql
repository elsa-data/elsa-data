# return the htsget data sharing config for the given release
#

with
  r := (select release::Release { } filter .releaseKey = <str>$releaseKey)

select {
  copyOutEnabled := r.dataSharingConfiguration.copyOutEnabled,
  copyOutDestinationLocation := r.dataSharingConfiguration.copyOutDestinationLocation,
}
