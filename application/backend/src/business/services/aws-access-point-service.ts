import { AuthenticatedUser } from "../authenticated-user";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import * as edgedb from "edgedb";
import { inject, injectable, singleton } from "tsyringe";
import { UsersService } from "./users-service";
import { AwsBaseService } from "./aws-base-service";
import {
  CloudFormationClient,
  DescribeStacksCommand,
  DescribeStacksCommandOutput,
} from "@aws-sdk/client-cloudformation";
import { AuditLogService } from "./audit-log-service";
import { stringify } from "csv-stringify";
import { Readable } from "stream";
import streamConsumers from "node:stream/consumers";
import { ReleaseService } from "./release-service";
import {
  correctAccessPointTemplateOutputs,
  createAccessPointTemplateFromReleaseFileEntries,
} from "./_access-point-template-helper";
import { ElsaSettings } from "../../config/elsa-settings";

// TODO we need to decide where we get the region from (running setting?) - or is it a config
const REGION = "ap-southeast-2";

@injectable()
@singleton()
export class AwsAccessPointService extends AwsBaseService {
  constructor(
    @inject("CloudFormationClient")
    private readonly cfnClient: CloudFormationClient,
    @inject("S3Client") private readonly s3Client: S3Client,
    @inject("Settings") private readonly settings: ElsaSettings,
    private readonly releaseService: ReleaseService,
    @inject("Database") edgeDbClient: edgedb.Client,
    usersService: UsersService,
    auditLogService: AuditLogService
  ) {
    super(edgeDbClient, usersService, auditLogService);
  }

  public static getReleaseStackName(releaseId: string): string {
    return `elsa-data-release-${releaseId}`;
  }

  /**
   * Returns the details from an installed access point stack for the given release
   * or null if there is no access point stack installed. This function can
   * be used to test for the existence of a stack for the release (it uses the
   * minimum resources to detect this and immediately returns null for no stack).
   *
   * @param user
   * @param releaseId
   */
  public async getInstalledAccessPointResources(
    user: AuthenticatedUser,
    releaseId: string
  ): Promise<{
    stackName: string;
    stackId: string;
    bucketNameMap: { [x: string]: string };
  } | null> {
    const releaseStackName =
      AwsAccessPointService.getReleaseStackName(releaseId);

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
   * @param releaseId
   * @param tsvColumns an array of column names that will be used to construct the TSV columns (matching order)
   * @returns a proposed filename and the content of a TSV
   */
  public async getAccessPointFileList(
    user: AuthenticatedUser,
    releaseId: string,
    tsvColumns: string[]
  ) {
    // find all the files encompassed by this release as a flat array of S3 URLs
    // noting that these files will be S3 paths that
    const filesArray = await this.getAllFileRecords(user, releaseId);

    const stackResources = await this.getInstalledAccessPointResources(
      user,
      releaseId
    );

    if (!stackResources)
      throw new Error(
        "Access point file list was requested but the release does not appear to have a current access point"
      );

    for (const f of filesArray) {
      if (f.s3Bucket in stackResources.bucketNameMap) {
        f.s3Bucket = stackResources.bucketNameMap[f.s3Bucket];
        f.s3Url = `s3://${f.s3Bucket}/${f.s3Key}`;
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
      releaseId
    );

    const filename = `release-${releaseId.replaceAll("-", "")}-${counter}.tsv`;

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
   * @param releaseId the release id
   * @param accountIds an array of account ids that the files will be shared to
   * @param vpcId if specified, a specific VPC id that the files will further be restricted to
   */
  public async createAccessPointCloudFormationTemplate(
    user: AuthenticatedUser,
    releaseId: string,
    accountIds: string[],
    vpcId?: string
  ): Promise<string> {
    // the AWS guard is switched on as this needs to write out to S3
    this.enabledGuard();

    // find all the files encompassed by this release as a flat array of S3 URLs
    const filesArray = await this.getAllFileRecords(user, releaseId);

    // make a (nested) CloudFormation templates that will expose only these
    // files via an access point
    const accessPointTemplates =
      createAccessPointTemplateFromReleaseFileEntries(
        this.settings.awsTempBucket,
        REGION,
        releaseId,
        filesArray,
        accountIds,
        vpcId
      );

    // we've made the templates - but we need to save them to known locations in S3 so that we
    // can install them
    let rootTemplate;

    console.log(JSON.stringify(accessPointTemplates));

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
