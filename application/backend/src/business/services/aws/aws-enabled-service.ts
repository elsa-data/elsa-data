import { GetCallerIdentityCommand, STSClient } from "@aws-sdk/client-sts";
import { inject, injectable, singleton } from "tsyringe";
import { Logger } from "pino";

/**
 * The AWS enabled service detects that are enough permissions to use
 * AWS.
 */
@injectable()
@singleton()
export class AwsEnabledService {
  private enabled?: boolean;

  constructor(
    @inject("Logger") private readonly logger: Logger,
    @inject("STSClient")
    private readonly stsClient: STSClient
  ) {
    logger.debug(
      "Created AwsEnabledService instance - expecting this to only happen once"
    );
  }

  /**
   * Call this check if AWS is enabled.
   */
  public async isEnabled(): Promise<boolean> {
    if (this.enabled === undefined) {
      try {
        await this.stsClient.send(new GetCallerIdentityCommand({}));
        this.enabled = true;
      } catch (_) {
        this.enabled = false;
      }
    }

    return this.enabled;
  }

  /**
   * This method should be called on entry to each method in an AWS service
   * to guard against progressing.
   */
  public async enabledGuard() {
    if (!(await this.isEnabled()))
      throw new Error(
        "This service is not enabled due to lack of AWS credentials"
      );
  }
}
