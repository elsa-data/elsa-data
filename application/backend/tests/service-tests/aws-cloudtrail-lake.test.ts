import { AwsCloudTrailLakeService } from "../../src/business/services/aws-cloudtrail-lake-service";
import * as edgedb from "edgedb";
import e from "../../dbschema/edgeql-js";
import { container } from "tsyringe";
import { registerTypes } from "./setup";

import { blankTestData } from "../../src/test-data/blank-test-data";

let awsCloudTrailLakeService: AwsCloudTrailLakeService;
const edgedbClient = edgedb.createClient();

describe("AWS s3 client", () => {
  beforeAll(async () => {
    container.register<edgedb.Client>("Database", {
      useFactory: () => edgedbClient,
    });

    const testContainer = await registerTypes();
    awsCloudTrailLakeService = testContainer.resolve(AwsCloudTrailLakeService);
  });

  beforeEach(async () => {
    await blankTestData();
    awsCloudTrailLakeService = container.resolve(AwsCloudTrailLakeService);
  });

  it("Test load CloudTrail events to DB", async () => {
    const BUCKET_NAME = "elsa-bucket";
    const KEY = "FAM007.fastq.gz";

    jest
      .spyOn(awsCloudTrailLakeService, "getCloudTrailLakeEvents")
      .mockImplementation(async () => [
        {
          releaseId: "abcd-defg-hijk-lmno",
          eventTime: "2022-10-24 05:56:40.000",
          sourceIPAddress: "192.19.192.192",
          bucketName: BUCKET_NAME,
          key: KEY,
          bytesTransferredOut: 100,
        },
      ]);

    // Insert a new releaseAuditEvent as the parent schema
    const aeId = await e
      .insert(e.audit.ReleaseAuditEvent, {
        whoId: "abcd",
        whoDisplayName: "John",
        actionCategory: e.audit.ActionType.R,
        actionDescription: "Test load CloudTrail event",
        occurredDateTime: new Date(),
        outcome: 0,
      })
      .run(edgedbClient);

    // Insert a file that links to
    await e
      .insert(e.storage.File, {
        url: `s3://${BUCKET_NAME}/${KEY}`,
        size: 123,
        checksums: [{ type: "MD5", value: "abcde123" }],
      })
      .run(edgedbClient);

    await awsCloudTrailLakeService.recordCloudTrailLogByReleaseId({
      releaseAuditEventId: aeId.id,
    });

    const dataAccessAudit = await e
      .select(e.audit.DataAccessAuditEvent, () => ({}))
      .run(edgedbClient);
    console.log(dataAccessAudit);
    expect(dataAccessAudit.length).toEqual(1);
  });
});
