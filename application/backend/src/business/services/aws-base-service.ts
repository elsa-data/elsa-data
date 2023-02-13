import { GetCallerIdentityCommand, STSClient } from "@aws-sdk/client-sts";

export abstract class AwsBaseService {
  private enabled: boolean;

  protected constructor() {
    // until we get proof our AWS commands have succeeded we assume AWS functionality is not available
    this.enabled = false;

    const stsClient = new STSClient({});

    stsClient
      .send(new GetCallerIdentityCommand({}))
      .then((result) => {
        this.enabled = true;
      })
      .catch((err) => {});
  }

  public get isEnabled(): boolean {
    return this.enabled;
  }

  protected enabledGuard() {
    if (!this.enabled)
      throw new Error(
        "This service is not enabled due to lack of AWS credentials"
      );
  }
}
