import { S3Client } from "@aws-sdk/client-s3";
import { inject, injectable, singleton } from "tsyringe";
import { AwsBaseService } from "./aws-base-service";
import { HttpRequest } from "@aws-sdk/protocol-http";
import { S3RequestPresigner } from "@aws-sdk/s3-request-presigner";
import { parseUrl } from "@aws-sdk/url-parser";
import { Hash } from "@aws-sdk/hash-node";
import { formatUrl } from "@aws-sdk/util-format-url";
import { ElsaSettings } from "../../../config/elsa-settings";
import { IPresignedUrlProvider } from "../presigned-urls-service";
import assert from "assert";

@injectable()
@singleton()
export class AwsPresignedUrlsService
  extends AwsBaseService
  implements IPresignedUrlProvider
{
  readonly protocol = "s3";

  constructor(@inject("Settings") private settings: ElsaSettings) {
    super();
  }

  async presign(
    releaseKey: string,
    bucket: string,
    key: string
  ): Promise<string> {
    const s3Client = new S3Client({});
    const awsRegion = await s3Client.config.region();

    assert(this.settings.aws);

    // we use the S3 client credentials as a backup - but we actually will prefer to use the static credentials given to
    // us via settings (this is what allows us to extend the share out to 7 days - otherwise we are bound by the lifespan
    // of the running AWS credentials which will normally be hours not days)
    const awsCredentials =
      this.settings.aws.signingAccessKeyId &&
      this.settings.aws.signingSecretAccessKey
        ? {
            sessionToken: undefined,
            accessKeyId: this.settings.aws.signingAccessKeyId,
            secretAccessKey: this.settings.aws.signingSecretAccessKey,
          }
        : s3Client.config.credentials;

    const s3ObjectUrl = parseUrl(
      `https://${bucket}.s3.${awsRegion}.amazonaws.com/${key}`
    );
    s3ObjectUrl.query = {
      "x-releaseKey": releaseKey,
    };

    const presigner = new S3RequestPresigner({
      credentials: awsCredentials,
      region: awsRegion,
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
