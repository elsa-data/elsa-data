# return the object signing data sharing config for the given release
#

with
  r := (select release::Release { } filter .releaseKey = <str>$releaseKey)

select {
  objectSigningEnabled := r.dataSharingConfiguration.objectSigningEnabled,
  objectSigningExpiryHours := r.dataSharingConfiguration.objectSigningExpiryHours,
}
