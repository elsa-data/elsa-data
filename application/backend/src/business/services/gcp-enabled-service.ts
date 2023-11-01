import { GoogleAuth } from "google-auth-library";
import { inject, injectable } from "tsyringe";
import { Logger } from "pino";

@injectable()
export class GcpEnabledService {
  private enabled?: boolean;

  constructor(@inject("Logger") private readonly logger: Logger) {
    logger.debug(
      "Created GcpEnabledInstance instance - expecting this to only happen once",
    );
  }

  /**
   * Call this check if AWS is enabled.
   */
  public async isEnabled(): Promise<boolean> {
    if (this.enabled === undefined) {
      try {
        const auth = new GoogleAuth({
          scopes: "https://www.googleapis.com/auth/cloud-platform",
        });

        await auth.getApplicationDefault();
        this.enabled = true;
      } catch (_) {
        this.enabled = false;
      }
    }

    return this.enabled;
  }

  /**
   * This method should be called on entry to each method in a GCP service
   * to guard against progressing.
   */
  public async enabledGuard() {
    if (!(await this.isEnabled()))
      throw new Error(
        "This service is not enabled due to lack of GCP credentials",
      );
  }
}
