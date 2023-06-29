import { mockClient } from "aws-sdk-client-mock";
import {
  DescribeExecutionCommand,
  DescribeMapRunCommand,
  ExecutionStatus,
  ListMapRunsCommand,
  SFNClient,
  StartExecutionCommand,
} from "@aws-sdk/client-sfn";
import { CloudTrailClient } from "@aws-sdk/client-cloudtrail";

export function createMockCloudTrail() {
  const cloudTrailMock = mockClient(CloudTrailClient);

  return cloudTrailMock;
}
