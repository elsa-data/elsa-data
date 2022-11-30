import { AuthenticatedUser } from "../authenticated-user";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import * as edgedb from "edgedb";
import { inject, injectable, singleton } from "tsyringe";
import { UsersService } from "./users-service";
import { randomBytes } from "crypto";
import { has } from "lodash";
import { AwsBaseService, ReleaseAwsFileRecord } from "./aws-base-service";
import {
  CloudFormationClient,
  CreateStackCommand,
  DescribeStackResourcesCommand,
  DescribeStacksCommand,
  DescribeStacksCommandOutput,
  StackResource,
  waitUntilStackCreateComplete,
} from "@aws-sdk/client-cloudformation";
import { AuditLogService } from "./audit-log-service";
import { stringify } from "csv-stringify";
import { Readable } from "stream";
import streamConsumers from "node:stream/consumers";
import archiver, { ArchiverOptions } from "archiver";
import { ReleaseService } from "./release-service";

// need to be configuration eventually
const BUCKET = "elsa-data-tmp";
const REGION = "ap-southeast-2";

@injectable()
@singleton()
export class AwsAccessPointService extends AwsBaseService {
  constructor(
    @inject("CloudFormationClient")
    private readonly cfnClient: CloudFormationClient,
    @inject("S3Client") private readonly s3Client: S3Client,
    @inject("Database") edgeDbClient: edgedb.Client,
    private releaseService: ReleaseService,
    usersService: UsersService,
    auditLogService: AuditLogService
  ) {
    super(edgeDbClient, usersService, auditLogService);
  }

  public static getReleaseStackName(releaseId: string): string {
    return `elsa-data-release-${releaseId}`;
  }

  private static bucketNameAsResource(bucketName: string): string {
    return Buffer.from(bucketName, "ascii").toString("hex");
  }

  private static resourceNameAsBucketName(resourceName: string): string {
    return new Buffer(resourceName, "hex").toString("ascii");
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
  ): Promise<{ stackName: string; stackId: string; outputs: any } | null> {
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
      console.log(e);
      return null;
    }

    if (!releaseStack.Stacks || releaseStack.Stacks.length != 1) return null;

    // TODO check stack status?? - should be complete_ok?
    const outputs: { [k: string]: string } = {};

    if (releaseStack.Stacks[0].Outputs) {
      releaseStack.Stacks[0].Outputs.forEach((o) => {
        outputs[AwsAccessPointService.resourceNameAsBucketName(o.OutputKey!)] =
          o.OutputValue!;
      });
    }

    return {
      stackName: releaseStackName,
      stackId: releaseStack.Stacks[0].StackId!,
      outputs: outputs,
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
      if (f.s3Bucket in stackResources.outputs) {
        f.s3Bucket = stackResources.outputs[f.s3Bucket];
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

    // the access points can only wrap a single bucket - so we need to
    // first group by bucket
    const filesByBucket: { [bucket: string]: ReleaseAwsFileRecord[] } = {};

    for (const af of filesArray) {
      if (!has(filesByBucket, af.s3Bucket)) {
        filesByBucket[af.s3Bucket] = [];
      }

      filesByBucket[af.s3Bucket].push(af);
    }

    // for our S3 paths we want to make sure every time we do this it is in someway unique
    const stackId = randomBytes(8).toString("hex");

    let subStackCount = 0;
    let subStackCurrent: any = {};
    let subStackAccessPointName = "";
    let subStackStackName = "";

    // const stackNamesByBucket: { [bucket: string]: string } = {};

    const rootStack: any = {
      AWSTemplateFormatVersion: "2010-09-09",
      Resources: {
        // as we add nested stacks (for each access point) we will place them here
      },
      Outputs: {
        // as we add nested stack (for each access point) we need to capture the outputs here
      },
    };

    const closeStack = async () => {
      // we are safe from calling close() before we have even started making substacks
      if (subStackCount > 0) {
        rootStack.Resources[subStackStackName] = {
          Type: "AWS::CloudFormation::Stack",
          Properties: {
            TemplateURL: `https://${BUCKET}.s3.${REGION}.amazonaws.com/${stackId}/${subStackAccessPointName}.template`,
          },
        };
        rootStack.Outputs[subStackStackName] = {
          Value: {
            "Fn::GetAtt": [subStackStackName, "Outputs.S3AccessPointAlias"],
          },
        };

        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: BUCKET,
            Key: `${stackId}/${subStackAccessPointName}.template`,
            ContentType: "application/json",
            Body: Buffer.from(JSON.stringify(subStackCurrent)),
          })
        );
      }
    };

    /**
     * Add a new stack as an access point for files in the given bucket.
     *
     * @param bucketName
     */
    const addNewStack = (bucketName: string) => {
      subStackCount++;
      subStackAccessPointName = `${releaseId}-${subStackCount}`;
      subStackStackName =
        AwsAccessPointService.bucketNameAsResource(bucketName);

      subStackCurrent = {
        AWSTemplateFormatVersion: "2010-09-09",
        Description: `S3 AccessPoint template for allowing access in bucket ${bucketName} to files released in release ${releaseId}`,
        Resources: {
          S3AccessPoint: {
            Type: "AWS::S3::AccessPoint",
            Properties: {
              Bucket: bucketName,
              Name: subStackAccessPointName,
              PublicAccessBlockConfiguration: {
                BlockPublicAcls: true,
                IgnorePublicAcls: true,
                BlockPublicPolicy: true,
                RestrictPublicBuckets: true,
              },
              Policy: {
                Version: "2012-10-17",
                Statement: [
                  {
                    Action: ["s3:GetObject"],
                    Effect: "Allow",
                    Resource: [],
                    Principal: {
                      AWS: accountIds.map((ac) => `arn:aws:iam::${ac}:root`),
                    },
                  },
                ],
              },
            },
          },
        },
        Outputs: {
          S3AccessPointAlias: {
            Value: {
              "Fn::GetAtt": ["S3AccessPoint", "Alias"],
            },
            Description: "Alias of the S3 access point.",
          },
        },
      };

      if (vpcId) {
        subStackCurrent.Resources.S3AccessPoint.Properties["VpcConfiguration"] =
          {
            VpcId: vpcId,
          };
      }
    };

    for (const bucket of Object.keys(filesByBucket)) {
      await closeStack();

      addNewStack(bucket);

      for (const file of filesByBucket[bucket]) {
        subStackCurrent.Resources.S3AccessPoint.Properties.Policy.Statement[0].Resource.push(
          `arn:aws:s3:ap-southeast-2:843407916570:accesspoint/${subStackAccessPointName}/object/${file.s3Key}*`
        );
      }
    }

    await closeStack();

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: `${stackId}/install.template`,
        ContentType: "application/json",
        Body: Buffer.from(JSON.stringify(rootStack)),
      })
    );

    return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${stackId}/install.template`;
  }
}

/*
    await waitUntilStackCreateComplete(
      { client: this.cfnClient, maxWaitTime: 300 },
      {
        StackName: releaseStackName,
      }
    );

    const madeReleaseStack = await this.cfnClient.send(
      new DescribeStacksCommand({
        StackName: releaseStackName,
      })
    );

    if (
      madeReleaseStack &&
      madeReleaseStack.Stacks &&
      madeReleaseStack.Stacks.length > 0
    ) {
      const bucketToAliases: { [x: string]: string } = {};

      for (const o of madeReleaseStack.Stacks[0].Outputs || []) {
        bucketToAliases[
          AwsAccessPointService.resourceNameAsBucketName(o.OutputKey!)
        ] = o.OutputValue!;
      }

      for (const f of filesArray) {
        if (f.s3Bucket in bucketToAliases) {
          f.s3Bucket = bucketToAliases[f.s3Bucket];
          f.s3Url = `s3://${f.s3Bucket}/${f.s3Key}`;
        } else {
          throw new Error(`Bucket ${f.s3Bucket} found not in stack outputs`);
        }
      }

      console.log(filesArray);
    } else {
      console.log("Stack not found");
    }

    //console.log(`WROTE SCRIPTS IN FOLDER ${stackId}`);
    //console.log(stackNamesByBucket);

 */
