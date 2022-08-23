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
  waitUntilStackCreateComplete,
} from "@aws-sdk/client-cloudformation";
import { AuditLogService } from "./audit-log-service";

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
    usersService: UsersService,
    auditLogService: AuditLogService
  ) {
    super(edgeDbClient, usersService, auditLogService);
  }

  private static getReleaseStackName(releaseId: string): string {
    return `elsa-data-release-${releaseId}`;
  }

  private static bucketNameAsResource(bucketName: string): string {
    return Buffer.from(bucketName, "ascii").toString("hex");
  }

  private static resourceNameAsBucketName(resourceName: string): string {
    return new Buffer(resourceName, "hex").toString("ascii");
  }

  public async deleteCloudFormationAccessPointForRelease(
    user: AuthenticatedUser,
    releaseId: string
  ): Promise<void> {
    this.enabledGuard();
  }

  public async getCloudFormationAccessPointForReleaseDetails(
    user: AuthenticatedUser,
    releaseId: string
  ): Promise<void> {
    this.enabledGuard();

    const releaseStackName =
      AwsAccessPointService.getReleaseStackName(releaseId);

    try {
      const releaseReleaseStack = await this.cfnClient.send(
        new DescribeStackResourcesCommand({
          StackName: releaseStackName,
        })
      );
      console.log(releaseReleaseStack);
    } catch (e) {
      console.log("Stack for this release does not exist");
    }
  }

  public async installCloudFormationAccessPointForRelease(
    user: AuthenticatedUser,
    releaseId: string,
    accountIds: string[],
    vpcId?: string
  ): Promise<void> {
    this.enabledGuard();

    const releaseStackName =
      AwsAccessPointService.getReleaseStackName(releaseId);

    try {
      const releaseReleaseStack = await this.cfnClient.send(
        new DescribeStackResourcesCommand({
          StackName: releaseStackName,
        })
      );
      console.log(releaseReleaseStack);
    } catch (e) {
      console.log("Stack for this release does not exist");
    }

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

      //stackNamesByBucket[bucketName] = subStackStackName;

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
    };

    if (vpcId) {
      subStackCurrent.Resources.S3AccessPoint.Properties["VpcConfiguration"] = {
        VpcId: vpcId,
      };
    }

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

    const newReleaseStack = await this.cfnClient.send(
      new CreateStackCommand({
        StackName: releaseStackName,
        ClientRequestToken: stackId,
        TemplateURL: `https://${BUCKET}.s3.ap-southeast-2.amazonaws.com/${stackId}/install.template`,
        Capabilities: ["CAPABILITY_IAM"],
        OnFailure: "DELETE",
      })
    );

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
  }
}
