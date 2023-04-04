import { AuthenticatedUser } from "../authenticated-user";
import * as edgedb from "edgedb";
import { inject, injectAll, injectable, singleton } from "tsyringe";
import { UsersService } from "./users-service";
import { AuditLogService } from "./audit-log-service";
import { Readable } from "stream";
import archiver, { ArchiverOptions } from "archiver";
import { stringify } from "csv-stringify";
import streamConsumers from "node:stream/consumers";
import { ReleaseService } from "./release-service";
import { ElsaSettings } from "../../config/elsa-settings";
import { ReleaseViewError } from "../exceptions/release-authorisation";
import { ManifestService } from "./manifests/manifest-service";
import assert from "assert";

export interface IPresignedUrlProvider {
  isEnabled: boolean;
  protocol: string;
  presign(releaseKey: string, bucket: string, key: string): Promise<string>;
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
    key: string
  ): Promise<string> {
    for (const p of this.presignedUrlsServices)
      if (protocol === p.protocol) return p.presign(releaseKey, bucket, key);

    throw new Error(`Unhandled protocol ${protocol}`);
  }
}
