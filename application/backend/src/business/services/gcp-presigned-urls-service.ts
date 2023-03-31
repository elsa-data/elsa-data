import * as edgedb from "edgedb";
import { inject, injectable } from "tsyringe";
import { UsersService } from "./users-service";
import { GcpEnabledService } from "./gcp-enabled-service";
import { ReleaseService } from "./release-service";
import { ElsaSettings } from "../../config/elsa-settings";
import { IPresignedUrlProvider } from "./presigned-urls-service";
import { GetSignedUrlConfig, Storage } from "@google-cloud/storage";

@injectable()
export class GcpPresignedUrlsService implements IPresignedUrlProvider {
  readonly protocol = "gs";
  storage: Storage;

  constructor(
    @inject("Database") protected edgeDbClient: edgedb.Client,
    @inject("Settings") private settings: ElsaSettings,
    private releaseService: ReleaseService,
    usersService: UsersService,
    private readonly gcpEnabledService: GcpEnabledService
  ) {
    this.storage = new Storage();
  }

  public async isEnabled(): Promise<boolean> {
    return await this.gcpEnabledService.isEnabled();
  }

  async presign(
    releaseKey: string,
    bucket: string,
    key: string
  ): Promise<string> {
    await this.gcpEnabledService.enabledGuard();

    const options: GetSignedUrlConfig = {
      version: "v4",
      action: "read",
      // 7 days (minus 5 minutes to avoid bumping into Google's time limit)
      expires: Date.now() + 1000 * 60 * 60 * 24 * 7 - 1000 * 60 * 5,
    };

    // Get a v4 signed URL for reading the file
    const [url] = await this.storage
      .bucket(bucket)
      .file(key)
      .getSignedUrl(options);

    return url;
  }
}
