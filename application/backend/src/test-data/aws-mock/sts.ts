import { mockClient } from "aws-sdk-client-mock";
import {
  DiscoverInstancesCommand,
  ServiceDiscoveryClient,
} from "@aws-sdk/client-servicediscovery";
import { MOCK_AWS_OBJECT_SIGNING_SECRET_NAME } from "./secrets-manager";
import { MOCK_COPY_OUT_STEPS_ARN } from "./steps";
import { GetCallerIdentityCommand, STSClient } from "@aws-sdk/client-sts";

export function createMockSts() {
  const stsClientMock = mockClient(STSClient);

  stsClientMock.on(GetCallerIdentityCommand).resolves({
    Arn: "arn:blah:blah",
    Account: "1234567",
    UserId: "auserid",
  });

  return stsClientMock;
}
