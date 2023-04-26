import { mockClient } from "aws-sdk-client-mock";
import { GetCallerIdentityCommand, STSClient } from "@aws-sdk/client-sts";
import { injectable } from "tsyringe";

/**
 * Mock the AwsEnabledService.
 */
@injectable()
export class AwsEnabledServiceMock {
  private readonly stsClientMock = mockClient(STSClient);

  public enable() {
    this.stsClientMock.on(GetCallerIdentityCommand).resolves({});
  }

  public reset() {
    this.stsClientMock.reset();
  }
}
