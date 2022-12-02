import { ReleaseFileListEntry } from "../../../src/business/services/_release-file-list-helper";
import {
  AccessPointTemplateToSave,
  createAccessPointTemplateFromReleaseFileEntries,
} from "../../../src/business/services/_access-point-template-helper";

describe("Creating Access Point CloudFormation Templates", () => {
  let singleBucketFiles: ReleaseFileListEntry[];
  let dualBucketFiles: ReleaseFileListEntry[];

  const getTemplateJson = (apt: AccessPointTemplateToSave): any =>
    JSON.parse(apt.content);

  const makeEntry = (s3Url: string): ReleaseFileListEntry => {
    const _match = s3Url.match(/^s3?:\/\/([^\/]+)\/?(.*?)$/);

    if (!_match) {
      throw new Error("Our test data should be valid S3 urls");
    }
    return {
      s3Url: s3Url,
      s3Bucket: _match[1],
      s3Key: _match[2],
      // the fields below are not actually used in the template creation - so can be anything
      fileType: "NOTIMPORTANT",
      caseId: "ACASEID",
      patientId: "APATIENTID",
      specimenId: "ASPECIMENID",
      md5: "1234",
      size: "1000",
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
      expect(rootTemplateJson).toHaveProperty("Resources.S3AccessPoint");
      expect(rootTemplateJson).toHaveProperty("Outputs.S3AccessPointAlias");
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

    expect(result).toHaveLength(3);
    expect(result.filter((x) => x.root)).toHaveLength(1);

    {
      const rootTemplateJson = getTemplateJson(result.filter((x) => x.root)[0]);

      expect(rootTemplateJson).toHaveProperty(
        "AWSTemplateFormatVersion",
        "2010-09-09"
      );
      expect(rootTemplateJson).toHaveProperty("Resources.S3AccessPoint");
      expect(rootTemplateJson).toHaveProperty("Outputs.S3AccessPointAlias");
    }
  });

  // TODO once we have any size splitting functionality (to prevent the templates getting too large for AWS)
  //      then we should do some extra unit testing detail - the testing is pretty basic at the moment because
  //      the templates will either work or not work (there isn't much logic)
});
