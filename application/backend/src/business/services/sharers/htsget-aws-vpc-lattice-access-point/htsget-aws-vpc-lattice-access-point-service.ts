import {
  CloudFormationClient,
  DescribeStacksCommand,
  type DescribeStacksCommandOutput,
  type Stack,
} from "@aws-sdk/client-cloudformation";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import assert from "assert";
import { stringify } from "csv-stringify";
import { cloneDeep } from "lodash";
import streamConsumers from "node:stream/consumers";
import type { Logger } from "pino";
import { Readable } from "stream";
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
import {
  createCloudFormationTemplateFromObjects,
  VPC_LATTICE_ACCESS_POINT_ALIAS_KEY_SUFFIX,
  VPC_LATTICE_ACCESS_POINT_BUCKET_KEY_SUFFIX,
} from "./_vpc-lattice-access-point-template-helper";

type InstalledHtsgetAwsVpcLatticeAccessPoint = {
  releaseKey: string;

  stack: Stack;

  bucketsToAlias: Record<string, string>;
};

@injectable()
export class HtsgetAwsVpcLatticeAccessPointService {
  /**
   * Return the name of an access point cloudformation for the given release.
   * This method defines the common convention used for these names.
   *
   * @param releaseKey
   */
  public static getReleaseStackName(releaseKey: string): string {
    return `elsa-data-release-${releaseKey}`; //;-htsget-ap`;
  }

  constructor(
    @inject("Logger") private readonly logger: Logger,
    @inject("Settings") private readonly settings: ElsaSettings,
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
  ): Promise<InstalledHtsgetAwsVpcLatticeAccessPoint | null> {
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

    const stack = releaseStack.Stacks[0];

    if (!stack.Outputs) return null;

    const result: InstalledHtsgetAwsVpcLatticeAccessPoint = {
      releaseKey: releaseKey,
      stack: stack,
      bucketsToAlias: {},
    };

    // our stack outputs tell us how each bucket got named as an access point alias
    for (const o of stack.Outputs) {
      if (o.OutputKey!.endsWith(VPC_LATTICE_ACCESS_POINT_BUCKET_KEY_SUFFIX)) {
        // find the base name
        const baseId = o.OutputKey!.slice(
          0,
          -VPC_LATTICE_ACCESS_POINT_BUCKET_KEY_SUFFIX.length,
        );

        // lookup the corresponding alias
        for (const a of stack.Outputs) {
          if (
            a.OutputKey! ===
            baseId + VPC_LATTICE_ACCESS_POINT_ALIAS_KEY_SUFFIX
          ) {
            result.bucketsToAlias[o.OutputValue!] = a.OutputValue!;
          }
        }
      }
    }

    return result;
  }

  /**
   * Returns the htsget-rs authorisation structure for a given release.
   * AUTHENTICATION FOR THIS CALL MUST BE DONE BEFORE CALLING AS THE
   * HTSGET-RS SERVICE IS NOT A USER IN OUR SYSTEM - AND WILL ESTABLISH
   * IDENTITY SOME OTHER WAY.
   *
   * @param installedInfo
   */
  public async getHtsgetVpcLatticeAccessPointAuthorisation(
    installedInfo: InstalledHtsgetAwsVpcLatticeAccessPoint,
  ): Promise<any> {
    await this.awsEnabledService.enabledGuard();

    const bucketKeyManifest =
      await this.manifestService.getActiveBucketKeyManifest(
        installedInfo.releaseKey,
        ["s3"],
      );

    assert(
      bucketKeyManifest,
      "Active manifest appeared to be null even though this release has been activated",
    );

    const htsgetAuth: any[] = [];

    for (const obj of bucketKeyManifest.objects) {
      if (obj.objectStoreBucket in installedInfo.bucketsToAlias) {
        const newBucketAlias =
          installedInfo.bucketsToAlias[obj.objectStoreBucket];

        // non-index files (and anything not bam or vcf) shouldn't appear in the htsget manifest
        // TODO: improve our detection of these types - better than us doing string compares
        if (
          obj.objectStoreKey.endsWith("bam") ||
          obj.objectStoreKey.endsWith("vcf.gz")
        )
          htsgetAuth.push({
            location: {
              id: obj.specimenId,
              backend: `s3://${newBucketAlias}/${obj.objectStoreKey}`,
            },
            rules: [
              {
                format: obj.objectType,
              },
            ],
          });
      }
    }

    return {
      version: 1,
      htsgetAuth: htsgetAuth,
    };
  }

  /**
   * Returns the TSV file manifest for this release but with paths corrected
   * for the access point.
   *
   * @param user
   * @param releaseKey
   * @param tsvColumns an array of column names that will be used to construct the TSV columns (matching order)
   * @returns a proposed filename and the content of a TSV
   */
  public async getHtsgetVpcLatticeAccessPointBucketKeyManifest(
    user: AuthenticatedUser,
    releaseKey: string,
    tsvColumns: string[],
  ) {
    const { userRole, isActivated } =
      await this.releaseService.getBoundaryInfoWithThrowOnFailure(
        user,
        releaseKey,
      );

    if (!this.permissionService.canAccessData(userRole))
      throw new ReleaseViewError(releaseKey);

    if (!isActivated) throw new Error("needs to be activated");

    await this.awsEnabledService.enabledGuard();

    const bucketKeyManifest =
      await this.manifestService.getActiveBucketKeyManifest(releaseKey, ["s3"]);

    assert(
      bucketKeyManifest,
      "Active manifest appeared to be null even though this release has been activated",
    );

    const installedInfo =
      await this.getInstalledHtsgetAwsVpcLatticeAccessPoint(releaseKey);

    const newHtsgetObjects: any[] = [];

    for (const obj of bucketKeyManifest.objects) {
      if (obj.objectStoreBucket in installedInfo.bucketsToAlias) {
        const newBucketAlias =
          installedInfo.bucketsToAlias[obj.objectStoreBucket];

        // non-index files (and anything not bam or vcf) shouldn't appear in the htsget manifest
        // TODO: improve our detection of these types - better than us doing string compares
        if (
          obj.objectStoreKey.endsWith("bam") ||
          obj.objectStoreKey.endsWith("vcf.gz")
        ) {
          const newHtsgetObject = cloneDeep(obj);

          if (obj.objectStoreKey.endsWith("bam")) {
            newHtsgetObject.objectStoreUrl = `htsget://htsget.dev.umccr.org/reads/${obj.specimenId}`;
          } else {
            newHtsgetObject.objectStoreUrl = `htsget://htsget.dev.umccr.org/variants/${obj.specimenId}`;
          }

          newHtsgetObjects.push(newHtsgetObject);
        }
      }
    }

    // setup a TSV stream
    const stringifyColumnOptions = [];

    for (const header of tsvColumns) {
      stringifyColumnOptions.push({
        key: header,
        header: header.toUpperCase(),
      });
    }
    const stringifier = stringify({
      header: true,
      columns: stringifyColumnOptions,
      delimiter: "\t",
    });

    const readableStream = Readable.from(newHtsgetObjects);
    const buf = await streamConsumers.text(readableStream.pipe(stringifier));

    const counter = await this.releaseService.getIncrementingCounter(
      user,
      releaseKey,
    );

    const filename = `release-${releaseKey.replaceAll("-", "")}-${counter}.tsv`;

    return {
      filename: filename,
      content: buf,
    };
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
      bucketKeyManifest.objects,
      releaseInfo.dataSharingHtsgetAwsVpcLatticeAccessPoint.vpcId,
      this.settings.aws.vpcId,
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

    // return the HTTPS path to the root template that can then be passed to the installer job
    return template.templateHttps;
  }
}
