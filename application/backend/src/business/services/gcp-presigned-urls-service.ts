import * as edgedb from "edgedb";
import { inject, injectable, singleton } from "tsyringe";
import { UsersService } from "./users-service";
import { GcpBaseService } from "./gcp-base-service";
import { AuditLogService } from "./audit-log-service";
import { ReleaseService } from "./release-service";
import { ElsaSettings } from "../../config/elsa-settings";
import { IPresignedUrlProvider } from "./presigned-urls-service";
import { Storage, GetSignedUrlConfig } from "@google-cloud/storage";

@injectable()
export class GcpPresignedUrlsService
  extends GcpBaseService
  implements IPresignedUrlProvider
{
  readonly protocol = "gs";
  storage: Storage;

  constructor(
    @inject("Database") protected edgeDbClient: edgedb.Client,
    @inject("Settings") private settings: ElsaSettings,
    private releaseService: ReleaseService,
    usersService: UsersService
  ) {
    super();

    this.storage = new Storage();
  }

  async presign(
    releaseKey: string,
    bucket: string,
    key: string
  ): Promise<string> {
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
