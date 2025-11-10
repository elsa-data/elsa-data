import { CloudTrailClient } from "@aws-sdk/client-cloudtrail";
import { mockClient } from "aws-sdk-client-mock";

export function createMockCloudTrail() {
  const cloudTrailMock = mockClient(CloudTrailClient);

  return cloudTrailMock;
}
