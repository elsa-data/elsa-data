import { randomBytes } from "crypto";
import type { Logger } from "pino";
import type { ManifestBucketKeyObjectType } from "../../manifests/manifest-bucket-key-types";

export type AccessPointTemplateToSave = {
  root: boolean;
  templateBucket: string;
  templateKey: string;
  templateHttps: string;
  content: string;
};

// for access point work we are only interested in the following fields of our manifest objects
export type AccessPointEntry = Pick<
  ManifestBucketKeyObjectType,
  "objectStoreUrl" | "objectStoreBucket" | "objectStoreKey" | "accessPointArn"
> & {
  accessPointUnique?: string;
};

const VPC_ID_KEY = "VpcId";

const ACCOUNT_IDS_KEY = "AccountIds";

/**
 * Create an access point share resource
 * wrapping a single bucket that we can insert into
 * a cloud formation template.
 *
 * We note that this access point uses a principal of
 * the account that it is installed into (not a principal
 * from the account where the VPC is) - the only
 * thing that says "where" it is to be shared is the VPC id.
 * This is because the htsget endpoint will be handing
 * out pre-signed S3 URLs signed by itself, not signed
 * by a principal in the destination account.
 * So the VPC id condition is all that is used.
 *
 * @param bucketName
 * @param shareToVpcId
 */
function createAccessPointResourceForBucket(
  bucketName: string,
  shareToVpcId: string,
) {
  // note that we need to refer to the access point in the policy - so we can't let CloudFormation
  // choose the name
  // instead we use random
  const accessPointName = randomBytes(16).toString("hex");

  // note the subtle difference between the substitutions we want NodeJs to make versus the substitutions we want
  // CloudFormation to make - ${} vs \${ }

  // our Access Point policy statements MUST have the region and account in order to give context
  // to the access point name (which is per account/region)
  const r: any = {
    Type: "AWS::S3::AccessPoint",
    Properties: {
      Bucket: bucketName,
      Name: accessPointName,
      Policy: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: ["s3:GetObject"],
            Effect: "Allow",
            Resource: [
              {
                "Fn::Sub": `arn:aws:s3:\${AWS::Region}:\${AWS::AccountId}:accesspoint/${accessPointName}/object/*`,
              },
            ],
            Principal: {
              AWS: { "Fn::Sub": `arn:aws:iam::\${AWS::AccountId}:root` },
            },
            Condition: {
              StringEquals: {
                "aws:sourceVpc": shareToVpcId,
              },
            },
          },
        ],
      },
    },
  };

  return r;
}

/**
 * Create a CloudFormation template that installs access points for
 * sharing from all buckets in a release.
 *
 * @param logger
 * @param templateBucket the bucket where the template will eventually live
 * @param templateRegion the region where the template will eventually be installed
 * @param releaseKey a friendly named identifier for the release
 * @param objects the list of S3 objects that we are sharing
 * @param shareToAccountIds an array of account ids that the access point should share to
 * @param shareToVpcId the specific VPC id that should be specified in the access point
 */
export function createCloudFormationTemplateFromObjects(
  logger: Logger,
  templateBucket: string,
  templateRegion: string,
  releaseKey: string,
  objects: ManifestBucketKeyObjectType[],
  shareToAccountIds: string[],
  shareToVpcId: string,
): AccessPointTemplateToSave {
  // for the S3 paths of the resulting templates - we want to make sure every time we do this it is in someway unique
  // (these end up going into a temporary bucket and are later removed)
  const stackId = randomBytes(8).toString("hex");

  // the only limit we need to worry about for this is the 1MB cloud formation template limit
  // - which will take *a lot* of nested stack to reach - so for the moment we are not tracking
  // this.
  const rootStack: any = {
    AWSTemplateFormatVersion: "2010-09-09",
    Resources: {},
    Outputs: {},
  };

  const bucketSet = new Set<string>();

  for (const o of objects) {
    bucketSet.add(o.objectStoreBucket);
  }

  for (const bucket of bucketSet) {
    const bucketId = randomBytes(8).toString("hex");

    rootStack.Resources[bucketId] = createAccessPointResourceForBucket(
      bucket,
      shareToVpcId,
    );
    rootStack.Outputs[bucketId + "Alias"] = {
      Value: {
        "Fn::GetAtt": [bucketId, "Alias"],
      },
    };
    rootStack.Outputs[bucketId + "Bucket"] = {
      Value: bucket,
    };
  }

  console.log(JSON.stringify(rootStack, null, 2));

  return {
    root: true,
    templateHttps: `https://${templateBucket}.s3.${templateRegion}.amazonaws.com/${stackId}/install.template`,
    templateBucket: templateBucket,
    templateKey: `${stackId}/install.template`,
    content: JSON.stringify(rootStack),
  };
}
