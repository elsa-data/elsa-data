# return the htsget AWS VPC Lattice Access point data sharing config for the given release
#

WITH
  r := assert_exists((SELECT release::Release { } FILTER .releaseKey = <str>$releaseKey))

UPDATE
  r.dataSharingConfiguration
SET {
    htsgetAwsVpcLatticeAccessPointEnabled := false,
    htsgetAwsVpcLatticeAccessPointDestinationName := "",
    htsgetAwsVpcLatticeAccessPointInstalledVpcId := <str>{},
    htsgetAwsVpcLatticeAccessPointInstalledAccountId := <str>{},
    htsgetAwsVpcLatticeAccessPointInstalledHtsgetResponse := <json>{}
}
