import { ReleaseFileListEntry } from "./_release-file-list-helper";
import { has } from "lodash";
import { randomBytes } from "crypto";
import { Stack } from "@aws-sdk/client-cloudformation";

export type AccessPointTemplateToSave = {
  root: boolean;
  templateBucket: string;
  templateKey: string;
  templateHttps: string;
  content: string;
};

type AccessPointEntry = {
  s3Url: string;
  s3Bucket: string;
  s3Key: string;
};

function bucketNameAsResource(bucketName: string): string {
  return Buffer.from(bucketName, "ascii").toString("hex");
}

function resourceNameAsBucketName(resourceName: string): string {
  return new Buffer(resourceName, "hex").toString("ascii");
}

/**
 * Decode the Outputs of one of our Access Point cloud formation templates
 * so that we return a map of "source bucket" -> "access point bucket".
 * i.e. a file that was originally in bucket "umccr-dev-10g" might be mapped
 * to bucket "d-asdad-3423424sfsfs-s" as part of the access point.
 *
 * @param stack the top level Cloud Formation stack that we installed
 */
export function correctAccessPointTemplateOutputs(stack: Stack): {
  [k: string]: string;
} {
  const outputs: { [k: string]: string } = {};

  if (stack.Outputs) {
    stack.Outputs.forEach((o) => {
      outputs[resourceNameAsBucketName(o.OutputKey!)] = o.OutputValue!;
    });
  }

  return outputs;
}

/**
 * Create a set of AWS CloudFormation templates that can be saved out to S3
 * and then installed. The templates will create an Access Point sharing the
 * release files to a specific account/vpc.
 *
 * @param templateBucket
 * @param templateRegion
 * @param releaseId an identifier for the release (will normally be edgedb id) - but is only used a string
 * @param files
 * @param shareToAccountIds
 * @param shareToVpcId
 * @todo Does not account for splitting when templates grow too large - so is not suitable for long lists
 *       of files yet
 */
export function createAccessPointTemplateFromReleaseFileEntries(
  templateBucket: string,
  templateRegion: string,
  releaseId: string,
  files: ReleaseFileListEntry[],
  shareToAccountIds: string[],
  shareToVpcId?: string
): AccessPointTemplateToSave[] {
  const results: AccessPointTemplateToSave[] = [];

  // unlike the file entries array which has other fields (like specimenId etc) - we only interested in
  // the file entries - and duplicates should be removed
  // (e.g. a trio VCF might have three ReleaseFileListEntry (one for each person) - but we want to only list once)
  const uniqueEntries: { [u: string]: AccessPointEntry } = {};

  // I'd normally use a Set() here but we want to not have to the S3Url -> S3Bucket,S3key logic again
  files
    // skip any entries that don't have a valid url and decomposed
    .filter((v) => v.s3Url && v.s3Bucket && v.s3Key)
    // key by the s3url therefore removing duplicates
    .forEach((v) => {
      uniqueEntries[v.s3Url] = {
        s3Url: v.s3Url,
        s3Bucket: v.s3Bucket,
        s3Key: v.s3Key,
      };
    });

  // the access points can only wrap a single bucket - so we need to
  // first group by bucket
  const filesByBucket: { [bucket: string]: AccessPointEntry[] } = {};

  for (const f of Object.values(uniqueEntries)) {
    if (!has(filesByBucket, f.s3Bucket)) {
      filesByBucket[f.s3Bucket] = [];
    }

    filesByBucket[f.s3Bucket].push(f);
  }

  // for the S3 paths of the resulting templates - we want to make sure every time we do this it is in someway unique
  // (these end up going into a temporary bucket and are later removed)
  const stackId = randomBytes(8).toString("hex");

  let subStackCount = 0;
  let subStackCurrent: any = {};
  let subStackAccessPointName = "";
  let subStackStackName = "";

  const rootStack: any = {
    AWSTemplateFormatVersion: "2010-09-09",
    Resources: {
      // as we add nested stacks (for each access point) we will place them here
    },
    Outputs: {
      // as we add nested stack (for each access point) we need to capture the outputs here
    },
  };

  const closeStack = () => {
    // we are safe from calling close() before we have even started making substacks
    if (subStackCount > 0) {
      const templateHttps = `https://${templateBucket}.s3.${templateRegion}.amazonaws.com/${stackId}/${subStackAccessPointName}.template`;

      rootStack.Resources[subStackStackName] = {
        Type: "AWS::CloudFormation::Stack",
        Properties: {
          TemplateURL: templateHttps,
        },
      };
      rootStack.Outputs[subStackStackName] = {
        Value: {
          "Fn::GetAtt": [subStackStackName, "Outputs.S3AccessPointAlias"],
        },
      };

      results.push({
        root: false,
        templateHttps: templateHttps,
        templateBucket: templateBucket,
        templateKey: `${stackId}/${subStackAccessPointName}.template`,
        content: JSON.stringify(subStackCurrent),
      });
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
    subStackStackName = bucketNameAsResource(bucketName);

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
                    AWS: shareToAccountIds.map(
                      (ac) => `arn:aws:iam::${ac}:root`
                    ),
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

    if (shareToVpcId) {
      subStackCurrent.Resources.S3AccessPoint.Properties["VpcConfiguration"] = {
        VpcId: shareToVpcId,
      };
    }
  };

  for (const bucket of Object.keys(filesByBucket)) {
    closeStack();

    addNewStack(bucket);

    for (const file of filesByBucket[bucket]) {
      subStackCurrent.Resources.S3AccessPoint.Properties.Policy.Statement[0].Resource.push(
        // TODO: ?{ "Fn::Sub" : String } to replace Account Id
        `arn:aws:s3:ap-southeast-2:843407916570:accesspoint/${subStackAccessPointName}/object/${file.s3Key}*`
      );
    }
  }

  closeStack();

  results.push({
    root: true,
    templateHttps: `https://${templateBucket}.s3.${templateRegion}.amazonaws.com/${stackId}/install.template`,
    templateBucket: templateBucket,
    templateKey: `${stackId}/install.template`,
    content: JSON.stringify(subStackCurrent),
  });

  return results;
}
