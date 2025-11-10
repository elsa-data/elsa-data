import { GetCallerIdentityCommand, STSClient } from "@aws-sdk/client-sts";
import { mockClient } from "aws-sdk-client-mock";

export function createMockSts() {
  const stsClientMock = mockClient(STSClient);

  stsClientMock.on(GetCallerIdentityCommand).resolves({
    Arn: "arn:blah:blah",
    Account: "1234567",
    UserId: "auserid",
  });

  return stsClientMock;
}
