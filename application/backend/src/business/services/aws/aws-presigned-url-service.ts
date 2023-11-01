import { S3Client } from "@aws-sdk/client-s3";
import { inject, injectable } from "tsyringe";
import { AwsEnabledService } from "./aws-enabled-service";
import { HttpRequest } from "@smithy/protocol-http";
import { S3RequestPresigner } from "@aws-sdk/s3-request-presigner";
import { parseUrl } from "@smithy/url-parser";
import { Hash } from "@smithy/hash-node";
import { formatUrl } from "@aws-sdk/util-format-url";
import { ElsaSettings } from "../../../config/elsa-settings";
import { IPresignedUrlProvider } from "../presigned-url-service";
import { AwsDiscoveryService } from "./aws-discovery-service";
import { SharerObjectSigningType } from "../../../config/config-schema-sharer";

export function getObjectSigningSetting(
  settings: ElsaSettings,
): SharerObjectSigningType | undefined {
  // the typescript is not clever enough to work out the resolution of the discriminated union
  // to our object-signing type - so we need to typecast
  const objectSigningSettings = settings.sharers.filter(
    (s) => s.type === "object-signing",
  ) as SharerObjectSigningType[];

  if (objectSigningSettings.length < 1) {
    return undefined;
  }

  if (objectSigningSettings.length > 1)
    throw new Error(
      "For the moment we have only enabled the logic for a single object-signing sharer",
    );

  return objectSigningSettings[0];
}

@injectable()
export class AwsPresignedUrlService implements IPresignedUrlProvider {
  readonly protocol = "s3";

  constructor(
    @inject("Settings") private settings: ElsaSettings,
    @inject(AwsEnabledService)
    private readonly awsEnabledService: AwsEnabledService,
    @inject(AwsDiscoveryService)
    private readonly awsDiscoveryService: AwsDiscoveryService,
  ) {}

  public async presign(
    releaseKey: string,
    bucket: string,
    key: string,
    auditId: string,
  ): Promise<string> {
    const objectSigningSettings = getObjectSigningSetting(this.settings);

    if (!objectSigningSettings)
      throw new Error(
        "AWS Object Signing is unavailable without an equivalent sharer defined in the settings",
      );

    // we use a special external object signing service which is how we can get signed URLS extending
    // out to 7 days (otherwise we would be limited to < hour)
    const objectSigning =
      await this.awsDiscoveryService.locateObjectSigningPair();

    if (!objectSigning)
      throw new Error(
        "AWS Object Signing is unavailable because the service does not look like it has been installed",
      );

    const s3Client = new S3Client({});
    const awsRegion = await s3Client.config.region();

    const awsCredentials = {
      sessionToken: undefined,
      accessKeyId: objectSigning[0],
      secretAccessKey: objectSigning[1],
    };

    const s3ObjectUrl = parseUrl(
      `https://${bucket}.s3.${awsRegion}.amazonaws.com/${key}`,
    );

    // inject extra query parameters that can help us detecting these GET usage in CloudTrail
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
        expiresIn: objectSigningSettings.maxAgeInSeconds,
      }),
    );
  }

  public async isEnabled(): Promise<boolean> {
    return await this.awsEnabledService.isEnabled();
  }
}
