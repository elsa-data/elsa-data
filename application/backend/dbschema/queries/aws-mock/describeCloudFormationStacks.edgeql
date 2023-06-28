# Select all the cloud formation stacks

select mock::AwsCloudFormationStack {
  stackName,
  stackId,
  occurredDateTime
};
