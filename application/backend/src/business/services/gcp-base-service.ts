import { GoogleAuth } from "google-auth-library";

export abstract class GcpBaseService {
  private enabled: boolean;

  protected constructor() {
    this.enabled = false;

    const auth = new GoogleAuth({
      scopes: "https://www.googleapis.com/auth/cloud-platform",
    });

    auth
      .getApplicationDefault()
      .then(() => {
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
        "This service is not enabled due to lack of GCP credentials"
      );
  }
}
