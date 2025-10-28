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

export const VPC_LATTICE_ACCESS_POINT_ALIAS_KEY_SUFFIX = "Alias";

export const VPC_LATTICE_ACCESS_POINT_BUCKET_KEY_SUFFIX = "Bucket";

export const VPC_LATTICE_ACCESS_POINT_VPC_ID = "VpcId";

/**
 * Create an access point share resource
 * wrapping a single bucket that we can insert into
 * a cloud formation template.
 *
 * We note that this access point uses a principal of
 * the account that it is installed into.
 * GetObject will then be called two ways:
 * as it is expected
 * to be used with pre-signed URLs signed by the object
 * signer in our installed account.
 * HOWEVER, it then adds a condition requiring the use of
 * the URLs from either the VPC of the signer OR from the
 * destination VPC we are sharing to.
 *
 * @param bucketName
 * @param accessPointName
 * @param shareToVpcId
 * @param signingVpcId
 */
function createAccessPointResourceForBucket(
  bucketName: string,
  accessPointName: string,
  shareToVpcId: string,
  signingVpcId: string,
) {
  // note that we need to refer to the access point in the policy - so we can't let CloudFormation
  // choose the name

  // note the subtle difference between the substitutions we want NodeJs to make versus the substitutions we want
  // CloudFormation to make - ${} vs \${ }

  // our Access Point policy statements MUST have the region and account listed in the ARNs in order to give context
  // to the access point name (which is per account/region)
  return {
    Type: "AWS::S3::AccessPoint",
    Properties: {
      Bucket: bucketName,
      Name: accessPointName,
      DeletionPolicy: "Delete",
      Policy: {
        Version: "2012-10-17",
        Statement: [
          {
            // we deny all operations through this access point on both the access points
            // and the objects

            // the only exception is for requests coming from the VPCs that are whitelisted
            // which means in that case they will get to do any operations passed through
            // from the base bucket delegation
            Effect: "Deny",
            Action: "*",
            Principal: "*",
            Resource: [
              {
                "Fn::Sub": `arn:aws:s3:\${AWS::Region}:\${AWS::AccountId}:accesspoint/${accessPointName}`,
              },
              {
                "Fn::Sub": `arn:aws:s3:\${AWS::Region}:\${AWS::AccountId}:accesspoint/${accessPointName}/object/*`,
              },
            ],
            Condition: {
              StringNotEquals: {
                "aws:sourceVpc": [shareToVpcId, signingVpcId],
              },
            },
          },
        ],
      },
    },
  };
}

/**
 * Create a CloudFormation template that installs access points for
 * sharing from all buckets in a release.
 *
 * @param logger
 * @param templateBucket the bucket where the template will eventually live
 * @param templateRegion the region where the template will eventually be installed
 * @param objects the list of S3 objects that we are sharing
 * @param shareDestinationVpcId the specific destination VPC id that should be specified in the access point
 * @param signingVpcId the specific VPC id that will be where the signing principal lives
 */
export function createCloudFormationTemplateFromObjects(
  logger: Logger,
  templateBucket: string,
  templateRegion: string,
  objects: ManifestBucketKeyObjectType[],
  shareDestinationVpcId: string,
  signingVpcId: string,
): AccessPointTemplateToSave {
  // for the S3 paths of the resulting templates - we want to make sure every time we do this it is in someway unique
  // (these end up going into a temporary bucket and are later removed)
  const stackId = randomBytes(8).toString("hex");

  // the only limit we need to worry about for this is the 1MB cloud formation template
  // and for the moment the number of buckets we are likely to be sharing is well below
  // this.
  const rootStack: any = {
    AWSTemplateFormatVersion: "2010-09-09",
    Resources: {},
    Outputs: {
      [VPC_LATTICE_ACCESS_POINT_VPC_ID]: {
        Value: shareDestinationVpcId,
      },
    },
  };

  // we need to make an access point per bucket so lets compute the unique bucket names
  const bucketSet = new Set<string>();

  for (const o of objects) {
    bucketSet.add(o.objectStoreBucket);
  }

  for (const bucket of bucketSet) {
    // we choose a random name for the access point to refer to it both internally
    // to the cloudformation (the resource name) and to be the name of the access
    // point itself (which we have to set because a fixed name is required by the resource policy
    // for access points)
    // it is probably not necessary that both these random strings are the same string,
    // but can't see how it hurts if they are
    const accessPointName = randomBytes(8).toString("hex");

    rootStack.Resources[accessPointName] = createAccessPointResourceForBucket(
      bucket,
      accessPointName,
      shareDestinationVpcId,
      signingVpcId,
    );
    rootStack.Outputs[
      accessPointName + VPC_LATTICE_ACCESS_POINT_ALIAS_KEY_SUFFIX
    ] = {
      Value: {
        "Fn::GetAtt": [accessPointName, "Alias"],
      },
    };
    rootStack.Outputs[
      accessPointName + VPC_LATTICE_ACCESS_POINT_BUCKET_KEY_SUFFIX
    ] = {
      Value: bucket,
    };
  }

  return {
    root: true,
    templateHttps: `https://${templateBucket}.s3.${templateRegion}.amazonaws.com/${stackId}/install.template`,
    templateBucket: templateBucket,
    templateKey: `${stackId}/install.template`,
    content: JSON.stringify(rootStack),
  };
}
