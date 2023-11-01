import * as edgedb from "edgedb";
import { inject, injectable, injectAll } from "tsyringe";
import { ElsaSettings } from "../../config/elsa-settings";

export interface IPresignedUrlProvider {
  readonly protocol: string;

  isEnabled(): Promise<boolean>;
  presign(
    releaseKey: string,
    bucket: string,
    key: string,
    auditId: string,
  ): Promise<string>;
}

@injectable()
export class PresignedUrlService {
  constructor(
    @inject("Database") private readonly edgeDbClient: edgedb.Client,
    @inject("Settings") private readonly settings: ElsaSettings,
    @injectAll("IPresignedUrlProvider")
    private readonly presignedUrlServices: IPresignedUrlProvider[],
  ) {}

  public async isEnabled(): Promise<boolean> {
    for (const service of this.presignedUrlServices) {
      if (await service.isEnabled()) {
        return true;
      }
    }
    return false;
  }

  public async presign(
    releaseKey: string,
    protocol: string,
    bucket: string,
    key: string,
    auditId: string,
  ): Promise<string> {
    for (const p of this.presignedUrlServices)
      if (protocol === p.protocol)
        return p.presign(releaseKey, bucket, key, auditId);

    throw new Error(`Unhandled protocol ${protocol}`);
  }
}
