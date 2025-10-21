# return the htsget AWS VPC Lattice Access point data sharing config for the given release
#

WITH
  r := assert_exists((SELECT release::Release { } FILTER .releaseKey = <str>$releaseKey))

SELECT {
  htsgetAwsVpcLatticeAccessPointEnabled := r.dataSharingConfiguration.htsgetAwsVpcLatticeAccessPointEnabled,
  htsgetAwsVpcLatticeAccessPointDestinationName := r.dataSharingConfiguration.htsgetAwsVpcLatticeAccessPointDestinationName,

  htsgetAwsVpcLatticeAccessPointInstalledVpcId := r.dataSharingConfiguration.htsgetAwsVpcLatticeAccessPointInstalledVpcId,
  htsgetAwsVpcLatticeAccessPointInstalledAccountId := r.dataSharingConfiguration.htsgetAwsVpcLatticeAccessPointInstalledAccountId,
  htsgetAwsVpcLatticeAccessPointInstalledHtsgetResponse := r.dataSharingConfiguration.htsgetAwsVpcLatticeAccessPointInstalledHtsgetResponse
}
