import { AwsCloudTrailLakeService } from "../../src/business/services/aws-cloudtrail-lake-service";
import * as edgedb from "edgedb";
import e from "../../dbschema/edgeql-js";
import { container } from "tsyringe";
import { registerTypes } from "./setup";
import { Client } from "edgedb";
import { blankTestData } from "../../src/test-data/blank-test-data";
import { beforeEachCommon } from "./releases.common";
import { CloudTrailClient } from "@aws-sdk/client-cloudtrail";

let awsCloudTrailLakeService: AwsCloudTrailLakeService;
let edgeDbClient: Client;
let cloudTrailClient: CloudTrailClient;
let testReleaseId: string;

describe("Test CloudTrailLake Service", () => {
  beforeAll(async () => {
    const testContainer = await registerTypes();

    edgeDbClient = testContainer.resolve("Database");
    cloudTrailClient = testContainer.resolve("CloudTrailClient");
    awsCloudTrailLakeService = testContainer.resolve(AwsCloudTrailLakeService);
  });

  beforeEach(async () => {
    ({ testReleaseId } = await beforeEachCommon());
  });

  it("Test load CloudTrail events to DB", async () => {
    const BUCKET_NAME = "umccr-10g-data-dev";
    const KEY = "HG00096/HG00096.hard-filtered.vcf.gz";

    const mockData = [
      {
        releaseId: testReleaseId,
        eventTime: "2022-10-24 05:56:40.000",
        sourceIPAddress: "192.19.192.192",
        bucketName: BUCKET_NAME,
        key: KEY,
        bytesTransferredOut: "101.0",
      },
    ];

    await awsCloudTrailLakeService.recordCloudTrailLake(mockData);

    const daArr = await e
      .select(e.audit.DataAccessAuditEvent, (da) => ({
        ...da["*"],
        filter: e.op(da.release_.id, "=", e.uuid(testReleaseId)),
      }))
      .run(edgeDbClient);

    expect(daArr.length).toEqual(1);

    const singleLog = daArr[0];
    expect(singleLog.egressBytes).toEqual(101);
  });
});
