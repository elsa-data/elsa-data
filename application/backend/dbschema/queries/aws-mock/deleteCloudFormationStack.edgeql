# Delete the cloud formation stack

with cs := (delete mock::AwsCloudFormationStack filter .stackName = <str>$stackName)
select cs {id, stackName, stackId};
