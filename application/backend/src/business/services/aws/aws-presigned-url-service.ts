import { S3Client } from "@aws-sdk/client-s3";
import { inject, injectable } from "tsyringe";
import { AwsEnabledService } from "./aws-enabled-service";
import { HttpRequest } from "@aws-sdk/protocol-http";
import { S3RequestPresigner } from "@aws-sdk/s3-request-presigner";
import { parseUrl } from "@aws-sdk/url-parser";
import { Hash } from "@aws-sdk/hash-node";
import { formatUrl } from "@aws-sdk/util-format-url";
import { ElsaSettings } from "../../../config/elsa-settings";
import { IPresignedUrlProvider } from "../presigned-url-service";
import assert from "assert";
import { AwsDiscoveryService } from "./aws-discovery-service";

@injectable()
export class AwsPresignedUrlService implements IPresignedUrlProvider {
  readonly protocol = "s3";

  constructor(
    @inject("Settings") private settings: ElsaSettings,
    @inject(AwsEnabledService)
    private readonly awsEnabledService: AwsEnabledService,
    @inject(AwsDiscoveryService)
    private readonly awsDiscoveryService: AwsDiscoveryService
  ) {}

  public async presign(
    releaseKey: string,
    bucket: string,
    key: string,
    auditId: string
  ): Promise<string> {
    assert(this.settings.aws);

    const s3Client = new S3Client({});
    const awsRegion = await s3Client.config.region();

    // we use the S3 client credentials as a backup - but we actually will prefer to use the static credentials given to
    // us via our registered object signing service
    // (this is what allows us to extend the share out to 7 days - otherwise we are bound by the lifespan
    // of the running AWS credentials which will normally be hours not days)
    const objectSigning =
      await this.awsDiscoveryService.locateObjectSigningPair();

    const awsCredentials = objectSigning
      ? {
          sessionToken: undefined,
          accessKeyId: objectSigning[0],
          secretAccessKey: objectSigning[1],
        }
      : s3Client.config.credentials;

    const s3ObjectUrl = parseUrl(
      `https://${bucket}.s3.${awsRegion}.amazonaws.com/${key}`
    );
    s3ObjectUrl.query = {
      "x-releaseKey": releaseKey,
      "x-auditId": auditId,
    };

    const presigner = new S3RequestPresigner({
      credentials: awsCredentials,
      region: awsRegion,
      sha256: Hash.bind(null, "sha256"),
    });

    return formatUrl(
      await presigner.presign(new HttpRequest(s3ObjectUrl), {
        // TODO get this setting from the sharer config
        expiresIn: 60 * 60 * 24 * 7, // 7 days
      })
    );
  }

  public async isEnabled(): Promise<boolean> {
    return await this.awsEnabledService.isEnabled();
  }
}
