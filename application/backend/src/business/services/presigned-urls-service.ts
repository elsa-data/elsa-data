import * as edgedb from "edgedb";
import { inject, injectAll, injectable } from "tsyringe";
import { UsersService } from "./users-service";
import { AuditLogService } from "./audit-log-service";
import { ReleaseService } from "./release-service";
import { ElsaSettings } from "../../config/elsa-settings";
import { ManifestService } from "./manifests/manifest-service";

export interface IPresignedUrlProvider {
  isEnabled: boolean;
  protocol: string;
  presign(
    releaseKey: string,
    bucket: string,
    key: string,
    auditId: string
  ): Promise<string>;
}

@injectable()
export class PresignedUrlsService {
  constructor(
    @inject("Database") protected readonly edgeDbClient: edgedb.Client,
    @inject("Settings") private readonly settings: ElsaSettings,
    @injectAll("IPresignedUrlProvider")
    private readonly presignedUrlsServices: IPresignedUrlProvider[],
    private readonly releaseService: ReleaseService,
    private readonly usersService: UsersService,
    private readonly manifestService: ManifestService,
    private readonly auditLogService: AuditLogService
  ) {}

  public get isEnabled(): boolean {
    return this.presignedUrlsServices.some((p) => p.isEnabled);
  }

  public async presign(
    releaseKey: string,
    protocol: string,
    bucket: string,
    key: string,
    auditId: string
  ): Promise<string> {
    for (const p of this.presignedUrlsServices)
      if (protocol === p.protocol)
        return p.presign(releaseKey, bucket, key, auditId);

    throw new Error(`Unhandled protocol ${protocol}`);
  }
}
