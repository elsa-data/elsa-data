import type { Logger } from "pino";
import { inject, injectable } from "tsyringe";
import type { ElsaSettings } from "../../../config/elsa-settings";
import { ReleaseActivationGlobusTokenExpiredError } from "../../exceptions/release-activation";
import { GlobusEnabledService } from "./globus-enabled-service";

export type GlobusIdentityResult = {
  found: boolean;
  identity_id?: string;
};

/**
 * The Globus verify username service checks if the Globus Client ID
 */
@injectable()
export class GlobusService {
  constructor(
    @inject("Logger") private readonly logger: Logger,
    @inject("Settings") private readonly settings: ElsaSettings,
    @inject(GlobusEnabledService)
    private readonly globusEnabledService: GlobusEnabledService,
  ) {
    logger.debug(
      "Created GlobusService instance - expecting this to only happen once",
    );
  }

  /*
   * Get a short-lived token for Globus API calls.
   */
  public async getClientCredentialsToken(): Promise<string> {
    await this.globusEnabledService.enabledGuard();

    const globusSharer = this.settings.sharers?.find(
      (s) => s.type === "globus",
    )!;

    const basicAuth = Buffer.from(
      `${globusSharer.clientId}:${globusSharer.clientSecret}`,
    ).toString("base64");

    const response = await fetch("https://auth.globus.org/v2/oauth2/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        scope: "urn:globus:auth:scope:auth.globus.org:view_identities",
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get Globus token: ${response.status}`);
    }

    const data = await response.json();
    return data.access_token;
  }

  /**
   * Verify that a Globus username corresponse to a real identity.
   */
  public async verifyUsername(username: string): Promise<GlobusIdentityResult> {
    const token = await this.getClientCredentialsToken();

    const response = await fetch(
      `https://auth.globus.org/v2/api/identities?usernames=${encodeURIComponent(username)}&include=identity_provider`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (response.status === 400) {
      return { found: false };
    }

    if (!response.ok) {
      throw new Error(`Globus identity lookup failed: ${response.status}`);
    }

    const data = await response.json();
    const identity = data.identities?.[0];

    if (!identity || identity.status !== "used") {
      return { found: false };
    }

    return {
      found: true,
      identity_id: identity.id,
    };
  }

  /*
   * Assemble Globus Auth request URL with params.
   */
  public getAuthoriseUrl(state: string, redirectUri: string): string {
    const globusSharer = this.settings.sharers?.find(
      (s) => s.type == "globus",
    )!;
    const params = new URLSearchParams({
      client_id: globusSharer.clientId,
      response_type: "code",
      scope: "urn:globus:auth:scope:groups.api.globus.org:all",
      redirect_uri: redirectUri,
      state,
      prompt: "login",
    });
    return `https://auth.globus.org/v2/oauth2/authorize?${params}`;
  }

  /*
   * Exchange Globus auth code for token.
   */
  public async exchangeCodeForToken(
    code: string,
    redirectUri: string,
  ): Promise<string> {
    const globusSharer = this.settings.sharers?.find(
      (s) => s.type === "globus",
    )!;
    const basicAuth = Buffer.from(
      `${globusSharer.clientId}:${globusSharer.clientSecret}`,
    ).toString("base64");

    const response = await fetch("https://auth.globus.org/v2/oauth2/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error(`Globus token exchange failed: ${response.status}`);
    }

    const data = await response.json();
    return data.access_token;
  }

  /**
   * Add a researcher identity to a Globus group.
   * Uses a token from OAuth2 web flow and group id (specified in sharer config)
   */
  public async addResearcherToGroup(
    token: string,
    identityId: string,
    groupId: string,
  ): Promise<void> {
    const response = await fetch(
      `https://groups.api.globus.org/v2/groups/${groupId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          add: [
            {
              identity_id: identityId,
              role: "member",
            },
          ],
        }),
      },
    );

    if (response.status === 401) {
      throw new ReleaseActivationGlobusTokenExpiredError();
    }

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Globus add member failed: ${response.status} - ${body}`);
    }
  }

  /*
   * Remove a researcher identity from a Globus group.
   */
  public async removeResearcherGroup(
    token: string,
    identityId: string,
    groupId: string,
  ): Promise<void> {
    const response = await fetch(
      `https://groups.api.globus.org/v2/groups/${groupId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          remove: [
            {
              identity_id: identityId,
            },
          ],
        }),
      },
    );

    if (response.status === 401) {
      throw new ReleaseActivationGlobusTokenExpiredError();
    }

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Globus remove member failed: ${response.status} - ${body}`,
      );
    }
  }
}
