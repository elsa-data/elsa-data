import e from "../../../dbschema/edgeql-js";
import { registerTypes } from "../../test-dependency-injection.common";
import { Client } from "edgedb";
import { beforeEachCommon } from "../commons/releases.common";
import { CloudTrailClient } from "@aws-sdk/client-cloudtrail";
import { ElsaSettings } from "../../../src/config/elsa-settings";
import { TENG_URI } from "../../../src/test-data/dataset/insert-test-data-10g";
import { TENG_AWS_EVENT_DATA_STORE_ID } from "../../test-elsa-settings.common";
import { AuthenticatedUser } from "../../../src/business/authenticated-user";
import { NotAuthorisedUpdateDataEgressRecords } from "../../../src/business/exceptions/audit-authorisation";
import { AwsCloudTrailLakeService } from "../../../src/business/services/aws/aws-cloudtrail-lake-service";
import { AwsEnabledServiceMock } from "../client-mocks";
import { IPLookupService } from "../../../src/business/services/ip-lookup-service";

const testContainer = registerTypes();

let edgeDbClient: Client;
let cloudTrailClient: CloudTrailClient;
let testReleaseKey: string;
let elsaSetting: ElsaSettings;
let superAdminUser: AuthenticatedUser;
let allowedMemberUser: AuthenticatedUser;
let awsEnabledServiceMock: AwsEnabledServiceMock;

describe("Test CloudTrailLake Service", () => {
  beforeAll(async () => {
    elsaSetting = testContainer.resolve("Settings");
    edgeDbClient = testContainer.resolve("Database");
    cloudTrailClient = testContainer.resolve("CloudTrailClient");
    awsEnabledServiceMock = testContainer.resolve(AwsEnabledServiceMock);

    const ipLookupService = testContainer.resolve(IPLookupService);
    ipLookupService.setup();
  });

  beforeEach(async () => {
    awsEnabledServiceMock.reset();

    ({ superAdminUser, testReleaseKey, allowedMemberUser } =
      await beforeEachCommon(testContainer));
  });

  it("Test queryCloudTrailLake", async () => {
    const awsCloudTrailLakeService = testContainer.resolve(
      AwsCloudTrailLakeService
    );
    const BUCKET_NAME = "umccr-10g-data-dev";
    const KEY = "HG00096/HG00096.hard-filtered.vcf.gz";
    const mockData = [
      {
        eventTime: "2022-10-24 05:56:40.000",
        sourceIPAddress: "192.19.192.192",
        bucketName: BUCKET_NAME,
        key: KEY,
        bytesTransferredOut: "101.0",
        releaseKey: testReleaseKey,
        auditId: "abcd-defg-hijk-lmno",
        eventId: "1234-5678-1234-5678",
      },
    ];
    const release = await e
      .select(e.release.Release, (r) => ({
        filter_single: e.op(testReleaseKey, "=", r.releaseKey),
        datasetUris: true,
      }))
      .assert_single()
      .run(edgeDbClient);

    if (!release?.datasetUris)
      throw new Error("No dataset found in the release");

    jest
      .spyOn(awsCloudTrailLakeService, "queryCloudTrailLake")
      .mockImplementation(async () => mockData);

    const egressRecords = await awsCloudTrailLakeService.getNewEgressRecords({
      releaseKey: testReleaseKey,
      datasetUrisArray: release?.datasetUris,
      currentDate: new Date(),
    });

    expect(egressRecords.length).toBe(1);
    expect(egressRecords[0]).toStrictEqual({
      releaseKey: "TESTRELEASE0001",
      description: "Accessed via presigned url.",
      auditId: "abcd-defg-hijk-lmno",
      egressId: "1234-5678-1234-5678",
      occurredDateTime: new Date("2022-10-24T05:56:40.000Z"),
      sourceIpAddress: "192.19.192.192",
      egressBytes: 101,
      fileUrl: "s3://umccr-10g-data-dev/HG00096/HG00096.hard-filtered.vcf.gz",
    });
  });

  it("Test getEventDataStoreIdFromReleaseKey", async () => {
    const awsCloudTrailLakeService = testContainer.resolve(
      AwsCloudTrailLakeService
    );

    const eventDataStoreIdArr =
      awsCloudTrailLakeService.getEventDataStoreIdFromDatasetUris([TENG_URI]);

    expect(eventDataStoreIdArr).toEqual([TENG_AWS_EVENT_DATA_STORE_ID]);
  });
});
