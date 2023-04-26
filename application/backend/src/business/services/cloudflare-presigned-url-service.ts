import { inject, injectable } from "tsyringe";
import { HttpRequest } from "@aws-sdk/protocol-http";
import { S3RequestPresigner } from "@aws-sdk/s3-request-presigner";
import { parseUrl } from "@aws-sdk/url-parser";
import { Hash } from "@aws-sdk/hash-node";
import { formatUrl } from "@aws-sdk/util-format-url";
import { ElsaSettings } from "../../config/elsa-settings";
import { IPresignedUrlProvider } from "./presigned-url-service";
import assert from "assert";

@injectable()
export class CloudflarePresignedUrlService implements IPresignedUrlProvider {
  readonly protocol = "r2";

  constructor(@inject("Settings") private readonly settings: ElsaSettings) {}

  public async isEnabled(): Promise<boolean> {
    return !!this.settings.cloudflare;
  }

  async presign(
    releaseKey: string,
    bucket: string,
    key: string
  ): Promise<string> {
    throw new Error("not implemented");

    assert(this.settings.cloudflare);

    const s3ObjectUrl = parseUrl(`https://${bucket}.s3.amazonaws.com/${key}`);
    s3ObjectUrl.query = {
      "x-releaseKey": releaseKey,
    };

    const presigner = new S3RequestPresigner({
      credentials: {
        accessKeyId: this.settings.cloudflare!.signingAccessKeyId,
        secretAccessKey: this.settings.cloudflare!.signingSecretAccessKey,
      },
      region: "global",
      sha256: Hash.bind(null, "sha256"),
    });
    const url = formatUrl(
      await presigner.presign(new HttpRequest(s3ObjectUrl), {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
      })
    );
    return url;
  }
}
