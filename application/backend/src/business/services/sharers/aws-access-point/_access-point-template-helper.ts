import { chunk, groupBy, size } from "lodash";
import { randomBytes } from "crypto";
import { Stack } from "@aws-sdk/client-cloudformation";
import { ManifestBucketKeyObjectType } from "../../manifests/manifest-bucket-key-types";
import {
  GetAccessPointPolicyCommand,
  S3ControlClient,
} from "@aws-sdk/client-s3-control";

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
  "objectStoreUrl" | "objectStoreBucket" | "objectStoreKey"
> & {
  accessPointUnique?: string;
};

const NAME_SUFFIX = "Name";
const ALIAS_SUFFIX = "Alias";
const BUCKET_SUFFIX = "Bucket";

// these are not very rigorous - and possibly could be tightened (we assume some worst cases...)

// the max size of any individual access point policy is 20k
// given the max length of an object key = 1024 - we assume the (almost) worst
// (I mean to be fair - by assuming the worst we ignore all the other bits that take up space in a policy)
const OBJECTS_PER_ACCESS_POINT = 20;

// the max size of any individual cloud formation is 1MB - and so access point (with policy) ~ 30k (say)
// so lets put 30 in before switching to next stack
const ACCESS_POINTS_PER_STACK = 30;

// OTHER LIMIT WE *WILL* HIT
// we can only have 200 outputs in a stack - but our parent stack needs an Output per access point
// so 200 x OBJECTS_PER_ACCESS_POINT is the real fundamental limit

/**
 * Decode the Outputs of one of our Access Point cloud formation templates
 * so that we return a map of URLs to where they are now located
 * via the access point.
 *
 * @param stack the top level Cloud Formation stack that we installed
 * @param accountId the account id of where the stack/access points are installed
 */
export async function correctAccessPointUrls(
  stack: Stack,
  accountId: string
): Promise<Record<string, AccessPointEntry>> {
  if (!stack.Outputs) {
    return {};
  }

  const STACK_OUTPUT_VALUE_REGEX = new RegExp("^([^:]+):([^:]+):(.+)$");

  const POLICY_RESOURCE_REGEX = new RegExp(
    "^([^:]+):([^:]+):([^:]+):([^:]+):([^:]+):accesspoint/([^/]+)/object/(.*)\\*$"
  );

  const s3ControlClient = new S3ControlClient({});

  const results: Record<string, AccessPointEntry> = {};

  // there will be lots of outputs... each one ending in NAME_SUFFIX will point to the
  // name of the corresponding access point
  // the access point policy will tell us how to map files
  for (const o of stack.Outputs) {
    const stackOutputMatch = o.OutputValue!.match(STACK_OUTPUT_VALUE_REGEX);

    if (!stackOutputMatch) {
      throw new Error("Found stack output not matching our regex");
    }

    const accessPointUnique = o.OutputKey!;
    const accessPointName = stackOutputMatch[1];
    const accessPointAlias = stackOutputMatch[2];
    const accessPointBucket = stackOutputMatch[3];

    const policyResult = await s3ControlClient.send(
      new GetAccessPointPolicyCommand({
        AccountId: accountId,
        Name: accessPointName,
      })
    );

    if (policyResult.Policy) {
      const policyObject = JSON.parse(policyResult.Policy);

      // an example resource which we are mapping back to the original objects
      // [
      //    "arn:aws:s3:ap-southeast-2:123407916570:accesspoint/9c7c106/object/CHINESE/JETSONSHG002-HG003-HG004.joint.filter.vcf.gz*",
      //    "arn:aws:s3:ap-southeast-2:123407916570:accesspoint/9c7c106/object/CHINESE/JETSONSHG002-HG003-HG004.joint.filter.vcf.gz.csi*",
      //    "arn:aws:s3:ap-southeast-2:123407916570:accesspoint/9c7c106/object/ASHKENAZIM/HG002-HG003-HG004.joint.filter.vcf.gz*",
      //    "arn:aws:s3:ap-southeast-2:123407916570:accesspoint/9c7c106/object/ASHKENAZIM/HG002-HG003-HG004.joint.filter.vcf.gz.csi*"
      // ]
      for (const stmt of policyObject["Statement"] ?? []) {
        if (stmt["Action"] === "s3:GetObject") {
          for (const res of stmt["Resource"] ?? []) {
            const match = res.match(POLICY_RESOURCE_REGEX);
            if (match) {
              const originalS3 = `s3://${accessPointBucket}/${match[7]}`;

              results[originalS3] = {
                objectStoreUrl: `s3://${accessPointAlias}/${match[7]}`,
                objectStoreBucket: accessPointAlias,
                objectStoreKey: match[7],
              };
            }
          }
        }
      }
    }
  }

  return results;
}

/**
 * Takes the file list and does various sanitising and chunking steps.
 * Returns groups of objects that are not going be too big for a single
 * policy statement - but which are also restricted to belonging
 * to a single bucket.
 *
 * @param files
 */
function chunkIntoBiteSizes(files: ManifestBucketKeyObjectType[]) {
  // unlike the file entries array which has other fields (like specimenId etc) - we only interested in
  // the file entries
  // with our limited subset of fields - we need duplicates to be removed
  // (e.g. a trio VCF might have three ManifestBucketKeyObjectType (one for each person) - but we want to only list once)
  const uniqueEntries: { [u: string]: AccessPointEntry } = {};

  // I'd normally use a Set() here, but we want to not have to
  // the objectStoreUrl -> objectStoreBucket,objectStoreKey logic again
  files
    // skip any entries that don't have a valid url and decomposed
    .filter((v) => v.objectStoreUrl && v.objectStoreBucket && v.objectStoreKey)
    // key by the objectStoreUrl therefore removing duplicates
    .forEach((v) => {
      uniqueEntries[v.objectStoreUrl] = {
        objectStoreUrl: v.objectStoreUrl,
        objectStoreBucket: v.objectStoreBucket,
        objectStoreKey: v.objectStoreKey,
      };
    });

  // any single access point can only have objects from one bucket - so we need to first
  // split out into groups by bucket
  const filesByBucket = groupBy(
    Object.values(uniqueEntries),
    "objectStoreBucket"
  );

  // each access points can only wrap a single bucket and is size limited to a policy
  // statement of 20k - so we use some pretty broad logic to again chunk the entries for each bucket
  // we also assign a new unique key for each of these groups - which we record against the individual
  // object entries (we need this to reconcile stuff at the end)
  const filesByGroup: { [unique: string]: AccessPointEntry[] } = {};

  for (const [bucketName, bucketObjects] of Object.entries(filesByBucket)) {
    for (const c of chunk(bucketObjects, OBJECTS_PER_ACCESS_POINT)) {
      // create a new unique id
      const unique = randomBytes(8).toString("hex");

      if (unique in filesByGroup) {
        throw new Error(
          "We got incredibly unlucky in that we generated an identical 8 byte random number"
        );
      }

      for (const e of c) {
        e.accessPointUnique = unique;
      }

      filesByGroup[unique] = c;
    }
  }

  return filesByGroup;
}

/**
 * Create an access point share resource that we can insert into
 * a cloud formation template. For the given set of objects - assuming
 * a few pre-conditions.
 * - all objects are for the same bucket
 * - there is a limited number of objects to keep policy < 20k
 *
 * If you are going to use this function then you need to have made
 * all those pre-conditions - we are not checking them again here.
 *
 * @param groupUnique
 * @param groupObjects
 * @param shareToAccountIds
 * @param shareToVpcId
 */
function createAccessPointResourceForCloudFormation(
  groupUnique: string,
  groupObjects: AccessPointEntry[],
  shareToAccountIds: string[],
  shareToVpcId?: string
) {
  if (groupObjects.length === 0)
    throw new Error("Can't create an access point with no objects");

  // our pre-condition is that all objects belong to the same bucket
  // (our access point will fail if this is not true anyhow)
  const bucketName = groupObjects[0].objectStoreBucket;

  // note the subtle difference between the substitutions we want NodeJs to make versus the substitutions we want
  // CloudFormation to make - ${} vs \${ }

  // our Access Point policy statements MUST have the region and account

  const r: any = {
    Type: "AWS::S3::AccessPoint",
    Properties: {
      Bucket: bucketName,
      Name: groupUnique,
      Policy: {
        Version: "2012-10-17",
        Statement: [
          {
            Action: ["s3:GetObject"],
            Effect: "Allow",
            Resource: groupObjects.map((o) => ({
              "Fn::Sub": `arn:aws:s3:\${AWS::Region}:\${AWS::AccountId}:accesspoint/${groupUnique}/object/${o.objectStoreKey}*`,
            })),
            Principal: {
              AWS: shareToAccountIds.map((ac) => `arn:aws:iam::${ac}:root`),
            },
          },
          {
            Action: ["s3:ListBucket"],
            Effect: "Allow",
            Resource: {
              "Fn::Sub": `arn:aws:s3:\${AWS::Region}:\${AWS::AccountId}:accesspoint/${groupUnique}`,
            },
            Principal: {
              AWS: shareToAccountIds.map((ac) => `arn:aws:iam::${ac}:root`),
            },
          },
        ],
      },
    },
  };

  if (shareToVpcId) {
    r.Properties["VpcConfiguration"] = {
      VpcId: shareToVpcId,
    };
  }

  return r;
}

/**
 * Create a set of AWS CloudFormation templates that can be saved out to S3
 * and then installed. The templates will create an Access Point sharing the
 * release files to a specific account/vpc.
 *
 * @param templateBucket
 * @param templateRegion
 * @param releaseKey a friendly named identifier for the release
 * @param objects the list of S3 objects that we are sharing
 * @param shareToAccountIds an array of account ids that the access point should share to
 * @param shareToVpcId if present a specific VPC id that should be specified in the access point
 */
export function createAccessPointTemplateFromReleaseFileEntries(
  templateBucket: string,
  templateRegion: string,
  releaseKey: string,
  objects: ManifestBucketKeyObjectType[],
  shareToAccountIds: string[],
  shareToVpcId?: string
): AccessPointTemplateToSave[] {
  const rootTemplateName = "install.template";

  const results: AccessPointTemplateToSave[] = [];

  const objectGroups = chunkIntoBiteSizes(objects);

  // for the S3 paths of the resulting templates - we want to make sure every time we do this it is in someway unique
  // (these end up going into a temporary bucket and are later removed)
  const stackId = randomBytes(8).toString("hex");

  // the only limit we need to worry about for this is the 1MB cloud formation template limit
  // - which will take *a lot* of nested stack to reach - so for the moment we are not tracking
  // this.
  // TODO also put a size limit checker on the root template
  const rootStack: any = {
    AWSTemplateFormatVersion: "2010-09-09",
    Resources: {
      // as we add nested stacks we will place them here
    },
    Outputs: {
      // as we add nested stack we need to capture the outputs here
    },
  };

  let subStackCount = 0;
  let subStackCurrent: any = {};
  let subStackAccessPointName = "";
  let subStackStackName = "";
  let subStackGroupUniques: string[] = [];

  // declare that we are finished with the current substack and we want to add it into
  // our parent
  const closeSubStack = () => {
    // we are safe from calling close() before we have even started making substacks
    if (subStackCount > 0) {
      const templateHttps = `https://${templateBucket}.s3.${templateRegion}.amazonaws.com/${stackId}/${subStackAccessPointName}.template`;

      rootStack.Resources[subStackStackName] = {
        Type: "AWS::CloudFormation::Stack",
        Properties: {
          TemplateURL: templateHttps,
        },
      };
      for (const g of subStackGroupUniques) {
        rootStack.Outputs[g] = {
          Value: {
            "Fn::Join": [
              ":",
              [
                {
                  "Fn::GetAtt": [
                    subStackStackName,
                    `Outputs.${g}${NAME_SUFFIX}`,
                  ],
                },
                {
                  "Fn::GetAtt": [
                    subStackStackName,
                    `Outputs.${g}${ALIAS_SUFFIX}`,
                  ],
                },
                {
                  "Fn::GetAtt": [
                    subStackStackName,
                    `Outputs.${g}${BUCKET_SUFFIX}`,
                  ],
                },
              ],
            ],
          },
        };
      }

      if (shareToVpcId)
        rootStack.Outputs["VpcId"] = {
          Value: shareToVpcId,
        };

      rootStack.Outputs["AccountIds"] = {
        Value: shareToAccountIds.join(","),
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

  const addNewSubStack = () => {
    //subStackCount++;
    //subStackAccessPointName = `${releaseKey.toLowerCase()}-${subStackCount}`;
    subStackStackName = randomBytes(8).toString("hex");
    subStackGroupUniques = [];

    subStackCurrent = {
      AWSTemplateFormatVersion: "2010-09-09",
      Description: `Elsa Data nested template for release ${releaseKey}`,
      Resources: {},
      Outputs: {},
    };
  };

  addNewSubStack();

  for (const [groupUnique, groupObjects] of Object.entries(objectGroups)) {
    // create a new access point for this group and it into the current substack
    subStackCurrent.Resources[groupUnique] =
      createAccessPointResourceForCloudFormation(
        groupUnique,
        groupObjects,
        shareToAccountIds,
        shareToVpcId
      );

    // from each stack we share outputs of each access point Alias and name and bucket
    // we then collect these into the parent stack
    subStackCurrent.Outputs[groupUnique + NAME_SUFFIX] = {
      Value: {
        "Fn::GetAtt": [groupUnique, "Name"],
      },
    };
    subStackCurrent.Outputs[groupUnique + ALIAS_SUFFIX] = {
      Value: {
        "Fn::GetAtt": [groupUnique, "Alias"],
      },
    };
    subStackCurrent.Outputs[groupUnique + BUCKET_SUFFIX] = {
      Value: groupObjects[0].objectStoreBucket,
    };

    subStackGroupUniques.push(groupUnique);

    // if too large - need to make another substack
    if (size(subStackCurrent.Resources) >= ACCESS_POINTS_PER_STACK) {
      closeSubStack();

      addNewSubStack();
    }
  }

  closeSubStack();

  results.push({
    root: true,
    templateHttps: `https://${templateBucket}.s3.${templateRegion}.amazonaws.com/${stackId}/${rootTemplateName}`,
    templateBucket: templateBucket,
    templateKey: `${stackId}/${rootTemplateName}`,
    content: JSON.stringify(rootStack),
  });

  return results;
}
