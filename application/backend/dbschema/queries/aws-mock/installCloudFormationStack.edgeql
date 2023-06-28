# Insert a mock AWS cloud formation install

insert mock::AwsCloudFormationStack {
  stackName := <str>$stackName,
  stackId := <str>$stackId,
  occurredDateTime := datetime_current()
};
