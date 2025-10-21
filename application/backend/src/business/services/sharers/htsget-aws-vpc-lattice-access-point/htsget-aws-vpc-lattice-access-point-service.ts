import {
  CloudFormationClient,
  DescribeStacksCommand,
  type DescribeStacksCommandOutput,
  type Stack,
} from "@aws-sdk/client-cloudformation";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import assert from "assert";
import * as gel from "gel";
import type { Logger } from "pino";
import { inject, injectable } from "tsyringe";
import type { ElsaSettings } from "../../../../config/elsa-settings";
import { AuthenticatedUser } from "../../../authenticated-user";
import { ReleaseDataSharingConfigurationData } from "../../../data/release-data-sharing-configuration-data.ts";
import { ReleaseViewError } from "../../../exceptions/release-authorisation";
import { AuditEventService } from "../../audit-event-service";
import { AwsEnabledService } from "../../aws/aws-enabled-service";
import { ManifestService } from "../../manifests/manifest-service";
import { PermissionService } from "../../permission-service";
import { ReleaseService } from "../../releases/release-service";
import { UserService } from "../../user-service";
import { createCloudFormationTemplateFromObjects } from "./_vpc-lattice-access-point-template-helper";

@injectable()
export class HtsgetAwsVpcLatticeAccessPointService {
  /**
   * Return the name of an access point cloudformation for the given release.
   * This method defines the common convention used for these names.
   *
   * @param releaseKey
   */
  public static getReleaseStackName(releaseKey: string): string {
    return `elsa-data-release-${releaseKey}`;
  }

  constructor(
    @inject("Logger") private readonly logger: Logger,
    @inject("Settings") private readonly settings: ElsaSettings,
    @inject("Database") private readonly edgeDbClient: gel.Client,
    @inject("CloudFormationClient")
    private readonly cfnClient: CloudFormationClient,
    @inject("S3Client") private readonly s3Client: S3Client,
    @inject(ManifestService) private readonly manifestService: ManifestService,
    @inject(ReleaseService) private readonly releaseService: ReleaseService,
    @inject(UserService) private readonly userService: UserService,
    @inject(ReleaseDataSharingConfigurationData)
    private readonly releaseDataSharingConfigurationData: ReleaseDataSharingConfigurationData,
    @inject(PermissionService)
    private readonly permissionService: PermissionService,
    @inject(AuditEventService)
    private readonly auditLogService: AuditEventService,
    @inject(AwsEnabledService)
    private readonly awsEnabledService: AwsEnabledService,
  ) {}

  /**
   * Returns the details from an installed access point stack for the given release
   * or null if there is no access point stack installed. This function can
   * be used to test for the existence of a stack for the release (it uses the
   * minimum resources to detect this and immediately returns null for no stack).
   *
   * @param releaseKey
   * @returns details of the installed access point or null if none is installed
   */
  public async getInstalledHtsgetAwsVpcLatticeAccessPoint(
    releaseKey: string,
  ): Promise<Stack | null> {
    await this.awsEnabledService.enabledGuard();

    const releaseStackName =
      HtsgetAwsVpcLatticeAccessPointService.getReleaseStackName(releaseKey);

    let releaseStack: DescribeStacksCommandOutput;

    try {
      releaseStack = await this.cfnClient.send(
        new DescribeStacksCommand({
          StackName: releaseStackName,
        }),
      );
    } catch (e) {
      // describing a stack that is not present throws an exception so we take that to mean it is
      // not present
      // TODO tighten the error code here so we don't gobble up other "unexpected" errors
      return null;
    }

    if (!releaseStack.Stacks || releaseStack.Stacks.length != 1) return null;

    return releaseStack.Stacks[0];
  }

  /**
   * For the given release id create a cloudformation template for making
   * access points that allow the htsget data block access from the destination.
   *
   * Note that this function operates entirely independently to access points that may or may not
   * already exist. This function just works out a template and saves it. Installation/deletion
   * is done separately in the jobs service.
   *
   * @param user the user asking for the cloud formation template (may alter which data is released)
   * @param releaseKey the release id
   * @param destinationName the name of the access point config
   */
  public async createHtsgetVpcLatticeAccessPointCloudFormationTemplate(
    user: AuthenticatedUser,
    releaseKey: string,
    destinationName: string,
  ): Promise<string> {
    // the AWS guard is switched on as this needs to write out to S3
    await this.awsEnabledService.enabledGuard();

    // convince typescript that these are also valid
    assert(
      this.settings.aws,
      "There were no settings present for AWS temporary buckets (are you running in AWS?)",
    );
    assert(
      this.settings.deployedAwsRegion,
      "There were no settings present for AWS region (are you running in AWS?)",
    );

    const { userRole } =
      await this.releaseService.getBoundaryInfoWithThrowOnFailure(
        user,
        releaseKey,
      );

    if (userRole !== "Administrator") {
      throw new ReleaseViewError(releaseKey);
    }

    // Store access point name to its own db
    await this.releaseService.setDataSharingConfigurationField(
      user,
      releaseKey,
      "/dataSharingConfiguration/htsgetAwsVpcLatticeAccessPointName",
      destinationName,
    );

    const releaseInfo = await this.releaseService.getBase(releaseKey, userRole);

    if (
      !releaseInfo.dataSharingHtsgetAwsVpcLatticeAccessPoint ||
      !releaseInfo.dataSharingHtsgetAwsVpcLatticeAccessPoint.name
    )
      throw new Error(
        "There were no data sharing configuration settings for htsget-aws-vpc-lattice-access-point saved for this release",
      );

    const bucketKeyManifest =
      await this.manifestService.getActiveBucketKeyManifest(releaseKey, ["s3"]);

    assert(
      bucketKeyManifest,
      "Active manifest appeared to be null even though this release has been activated",
    );

    if (bucketKeyManifest.objects.length === 0)
      throw new Error(
        "There were no S3 objects in the release so the htsget-aws-vpc-lattice-access-point has not been installed",
      );

    const template = createCloudFormationTemplateFromObjects(
      this.logger,
      this.settings.aws.tempBucket,
      this.settings.deployedAwsRegion,
      releaseKey,
      bucketKeyManifest.objects,
      [releaseInfo.dataSharingHtsgetAwsVpcLatticeAccessPoint.accountId],
      releaseInfo.dataSharingHtsgetAwsVpcLatticeAccessPoint.vpcId,
    );

    this.logger.debug(template, "created access point templates");

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: template.templateBucket,
        Key: template.templateKey,
        ContentType: "application/json",
        Body: Buffer.from(template.content),
      }),
    );

    // return the HTTPS path to the root template that can then be passed to the install job
    return template.templateHttps;
  }
}
