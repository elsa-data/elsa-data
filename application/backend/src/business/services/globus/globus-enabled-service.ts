import type { Logger } from "pino";
import { inject, injectable } from "tsyringe";
import type { ElsaSettings } from "../../../config/elsa-settings";

export interface IGlobusEnabledService {
  isEnabled(): Promise<boolean>;
  enabledGuard(): Promise<void>;
}

/**
 * The Globus enabled service detects if the configured Globus Client ID
 * and Client Secret are valid.
 */
@injectable()
export class GlobusEnabledService implements IGlobusEnabledService {
  private enabled?: boolean;

  constructor(
    @inject("Logger") private readonly logger: Logger,
    @inject("Settings") private readonly settings: ElsaSettings,
  ) {
    logger.debug(
      "Created GlobusEnabledService instance - expecting this to only happen once",
    );
  }

  /*
   * Call this to check if Globus credentials in config are valid.
   */
  public async isEnabled(): Promise<boolean> {
    if (this.enabled === undefined) {
      const globusSharer = this.settings.sharers?.find(
        (s) => s.type === "globus",
      );
      if (!globusSharer?.clientId || !globusSharer?.clientSecret) {
        this.logger.debug("Globus credentials not found in ElsaSettings.");
        this.enabled = false;
        return this.enabled;
      }

      try {
        const { clientId, clientSecret } = globusSharer;
        const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
          "base64",
        );

        const response = await fetch(
          "https://auth.globus.org/v2/oauth2/token",
          {
            method: "POST",
            headers: {
              Authorization: `Basic ${basicAuth}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
              grant_type: "client_credentials",
              scope: "urn:globus:auth:scope:transfer.api.globus.org:all",
            }),
          },
        );

        if (response.ok) {
          this.enabled = true;
        } else {
          const body = await response.text();
          this.logger
            .warn(`Globus credentials invalid. Status: ${response.status}, Body:
  ${body}`);
          this.enabled = false;
        }
      } catch (error) {
        this.logger.error(
          error,
          "Network or unexpected error while verifying Globus credentials",
        );
        this.enabled = false;
      }
    }

    return this.enabled;
  }

  /*
   * This method should be called on entry to each method in a Globus service
   * to guard against progressing.
   */
  public async enabledGuard(): Promise<void> {
    if (!(await this.isEnabled())) {
      throw new Error(
        "This service is not enabled due to missing or invalid Globus credentials",
      );
    }
  }
}
