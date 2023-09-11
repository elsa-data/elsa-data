import {
  AccessPointTemplateToSave,
  createAccessPointTemplateFromReleaseFileEntries,
} from "../../../src/business/services/sharers/aws-access-point/_access-point-template-helper";
import { ManifestBucketKeyObjectType } from "../../../src/business/services/manifests/manifest-bucket-key-types";

describe("Creating Access Point CloudFormation Templates", () => {
  let singleBucketFiles: ManifestBucketKeyObjectType[];
  let dualBucketFiles: ManifestBucketKeyObjectType[];

  const getTemplateJson = (apt: AccessPointTemplateToSave): any =>
    JSON.parse(apt.content);

  const makeEntry = (s3Url: string): ManifestBucketKeyObjectType => {
    const _match = s3Url.match(/^s3?:\/\/([^\/]+)\/?(.*?)$/);

    if (!_match) {
      throw new Error("Our test data should be valid S3 urls");
    }
    return {
      objectStoreProtocol: "",
      objectStoreUrl: s3Url,
      objectStoreBucket: _match[1],
      objectStoreKey: _match[2],
      // the fields below are not actually used in the template creation - so can be anything
      objectType: "NOTIMPORTANT",
      caseId: "ACASEID",
      patientId: "APATIENTID",
      specimenId: "ASPECIMENID",
      md5: "1234",
      objectSize: 1000,
      artifactId: "ANARTFACTID",
    };
  };
  beforeEach(() => {
    singleBucketFiles = [
      makeEntry("s3://umccr-dev/1.bam"),
      makeEntry("s3://umccr-dev/2.bam"),
      makeEntry("s3://umccr-dev/main.vcf.gz"),
    ];
    dualBucketFiles = [
      makeEntry("s3://umccr-dev/1.bam"),
      makeEntry("s3://umccr-dev/2.bam"),
      makeEntry("s3://umccr-prod/main.vcf.gz"),
    ];
  });

  it("Test Basic Creation of an Single Bucket Access Point Template", () => {
    const result = createAccessPointTemplateFromReleaseFileEntries(
      "BUCKET",
      "REGION",
      "RELEASEID",
      singleBucketFiles,
      ["123456789"],
      "vpc-123456"
    );

    expect(result).toHaveLength(2);
    expect(result.filter((x) => x.root)).toHaveLength(1);

    {
      const rootTemplateJson = getTemplateJson(result.filter((x) => x.root)[0]);

      expect(rootTemplateJson).toHaveProperty(
        "AWSTemplateFormatVersion",
        "2010-09-09"
      );
      expect(rootTemplateJson).toHaveProperty("Resources");

      const onlySubStack = Object.values(rootTemplateJson.Resources)[0];

      expect(onlySubStack).toHaveProperty("Type", "AWS::CloudFormation::Stack");
    }
  });

  it("Test Basic Creation of an Dual Bucket Access Point Template", () => {
    const result = createAccessPointTemplateFromReleaseFileEntries(
      "BUCKET",
      "REGION",
      "RELEASEID",
      dualBucketFiles,
      ["123456789"]
    );

    expect(result).toHaveLength(2);
    expect(result.filter((x) => x.root)).toHaveLength(1);

    {
      const rootTemplateJson = getTemplateJson(result.filter((x) => x.root)[0]);

      expect(rootTemplateJson).toHaveProperty(
        "AWSTemplateFormatVersion",
        "2010-09-09"
      );
    }
  });

  // TODO once we have any size splitting functionality (to prevent the templates getting too large for AWS)
  //      then we should do some extra unit testing detail - the testing is pretty basic at the moment because
  //      the templates will either work or not work (there isn't much logic)
});
