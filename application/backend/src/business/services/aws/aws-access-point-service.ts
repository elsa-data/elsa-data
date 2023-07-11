import { AuthenticatedUser } from "../../authenticated-user";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import * as edgedb from "edgedb";
import { inject, injectable } from "tsyringe";
import { UserService } from "../user-service";
import { AwsEnabledService } from "./aws-enabled-service";
import {
  CloudFormationClient,
  DescribeStacksCommand,
  DescribeStacksCommandOutput,
} from "@aws-sdk/client-cloudformation";
import { AuditEventService } from "../audit-event-service";
import { stringify } from "csv-stringify";
import { Readable } from "stream";
import streamConsumers from "node:stream/consumers";
import { ReleaseService } from "../releases/release-service";
import {
  correctAccessPointTemplateOutputs,
  createAccessPointTemplateFromReleaseFileEntries,
} from "../_access-point-template-helper";
import { ElsaSettings } from "../../../config/elsa-settings";
import { Logger } from "pino";
import { getAllFileRecords } from "../_release-file-list-helper";
import { ReleaseViewError } from "../../exceptions/release-authorisation";
import assert from "assert";

// TODO we need to decide where we get the region from (running setting?) - or is it a config
const REGION = "ap-southeast-2";

@injectable()
export class AwsAccessPointService {
  constructor(
    @inject("CloudFormationClient")
    private readonly cfnClient: CloudFormationClient,
    @inject("S3Client") private readonly s3Client: S3Client,
    @inject("Logger") private readonly logger: Logger,
    @inject("Settings") private readonly settings: ElsaSettings,
    @inject(ReleaseService) private readonly releaseService: ReleaseService,
    @inject("Database") private readonly edgeDbClient: edgedb.Client,
    @inject(UserService) private readonly userService: UserService,
    @inject(AuditEventService)
    private readonly auditLogService: AuditEventService,
    @inject(AwsEnabledService)
    private readonly awsEnabledService: AwsEnabledService
  ) {}
  public static getReleaseStackName(releaseKey: string): string {
    return `elsa-data-release-${releaseKey}`;
  }

  /**
   * Returns the details from an installed access point stack for the given release
   * or null if there is no access point stack installed. This function can
   * be used to test for the existence of a stack for the release (it uses the
   * minimum resources to detect this and immediately returns null for no stack).
   *
   * @param user
   * @param releaseKey
   */
  public async getInstalledAccessPointResources(releaseKey: string): Promise<{
    stackName: string;
    stackId: string;
    bucketNameMap: { [x: string]: string };
  } | null> {
    await this.awsEnabledService.enabledGuard();

    const releaseStackName =
      AwsAccessPointService.getReleaseStackName(releaseKey);

    let releaseStack: DescribeStacksCommandOutput;

    try {
      releaseStack = await this.cfnClient.send(
        new DescribeStacksCommand({
          StackName: releaseStackName,
        })
      );
    } catch (e) {
      // describing a stack that is not present throws an exception so we take that to mean it is
      // not present
      // TODO tighten the error code here so we don't gobble up other "unexpected" errors
      return null;
    }

    if (!releaseStack.Stacks || releaseStack.Stacks.length != 1) return null;

    // TODO check stack status?? - should be complete_ok?

    const outputs = correctAccessPointTemplateOutputs(releaseStack.Stacks[0]);

    return {
      stackName: releaseStackName,
      stackId: releaseStack.Stacks[0].StackId!,
      bucketNameMap: outputs,
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
  public async getAccessPointFileList(
    user: AuthenticatedUser,
    releaseKey: string,
    tsvColumns: string[]
  ) {
    const { userRole } =
      await this.releaseService.getBoundaryInfoWithThrowOnFailure(
        user,
        releaseKey
      );

    await this.awsEnabledService.enabledGuard();
    // find all the files encompassed by this release as a flat array of S3 URLs
    // noting that these files will be S3 paths that
    const filesArray = await getAllFileRecords(
      this.edgeDbClient,
      this.userService,
      user,
      releaseKey
    );

    const stackResources = await this.getInstalledAccessPointResources(
      releaseKey
    );

    if (!stackResources)
      throw new Error(
        "Access point file list was requested but the release does not appear to have a current access point"
      );

    for (const f of filesArray) {
      if (f.objectStoreBucket in stackResources.bucketNameMap) {
        f.objectStoreBucket = stackResources.bucketNameMap[f.objectStoreBucket];
        f.objectStoreUrl = `s3://${f.objectStoreBucket}/${f.objectStoreKey}`;
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

    const readableStream = Readable.from(filesArray);
    const buf = await streamConsumers.text(readableStream.pipe(stringifier));

    const counter = await this.releaseService.getIncrementingCounter(
      user,
      releaseKey
    );

    const filename = `release-${releaseKey.replaceAll("-", "")}-${counter}.tsv`;

    return {
      filename: filename,
      content: buf,
    };
  }

  /**
   * For the given release id, create a CloudFormation template sharing all
   * exposed files and save the template to S3.
   *
   * Note that this function operates entirely independently to access points that may or may not
   * already exist. This function just works out a template and saves it. Installation/deletion
   * is done separately in the jobs service.
   *
   * @param user the user asking for the cloud formation template (may alter which data is released)
   * @param releaseKey the release id
   */
  public async createAccessPointCloudFormationTemplate(
    user: AuthenticatedUser,
    releaseKey: string
  ): Promise<string> {
    // the AWS guard is switched on as this needs to write out to S3
    await this.awsEnabledService.enabledGuard();

    assert(this.settings.aws);

    const { userRole } =
      await this.releaseService.getBoundaryInfoWithThrowOnFailure(
        user,
        releaseKey
      );

    if (userRole !== "Administrator") {
      throw new ReleaseViewError(releaseKey);
    }

    const releaseInfo = await this.releaseService.getBase(releaseKey, userRole);

    if (
      !releaseInfo.dataSharingAwsAccessPoint ||
      !releaseInfo.dataSharingAwsAccessPoint.name
    )
      throw new Error(
        "There were no data sharing configuration settings for AWS Access Point saved for this release"
      );

    // TODO use file manifest
    // find all the files encompassed by this release as a flat array of S3 URLs
    const filesArray = await getAllFileRecords(
      this.edgeDbClient,
      this.userService,
      user,
      releaseKey
    );

    // make a (nested) CloudFormation templates that will expose only these
    // files via an access point
    const accessPointTemplates =
      createAccessPointTemplateFromReleaseFileEntries(
        this.settings.aws.tempBucket,
        REGION,
        releaseKey,
        filesArray,
        [releaseInfo.dataSharingAwsAccessPoint.accountId],
        releaseInfo.dataSharingAwsAccessPoint.vpcId
      );

    // we've made the templates - but we need to save them to known locations in S3 so that we
    // can install them
    let rootTemplate;

    this.logger.debug(accessPointTemplates, "created access point templates");

    for (const apt of accessPointTemplates) {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: apt.templateBucket,
          Key: apt.templateKey,
          ContentType: "application/json",
          Body: Buffer.from(apt.content),
        })
      );

      if (apt.root) rootTemplate = apt;
    }

    if (!rootTemplate)
      throw new Error(
        "Created an access point template but none of them were designated the root template that we can install"
      );

    // return the HTTPS path to the root template that can then be passed to the install job
    return rootTemplate.templateHttps;
  }
}
