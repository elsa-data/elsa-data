import { GetCallerIdentityCommand, STSClient } from "@aws-sdk/client-sts";

/**
 * The AWS base service provides some common functionality
 * for detecting that we are actually running with enough AWS
 * permissions.
 */
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
      .catch((err) => {
        // we choose to silently fail here as we don't want a Google running Elsa Data to be
        // littered with error messages stating that AWS isn't working
      });
  }

  public get isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * This method should be called on entry to each method in an AWS service
   * to guard against progressing.
   *
   * @protected
   */
  protected enabledGuard() {
    if (!this.enabled)
      throw new Error(
        "This service is not enabled due to lack of AWS credentials"
      );
  }
}
