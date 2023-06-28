import e from "../../dbschema/edgeql-js";
import { registerTypes } from "../test-dependency-injection.common";
import { Client } from "edgedb";
import { beforeEachCommon } from "./releases.common";
import { CloudTrailClient } from "@aws-sdk/client-cloudtrail";
import { ElsaSettings } from "../../src/config/elsa-settings";
import { TENG_URI } from "../../src/test-data/dataset/insert-test-data-10g";
import { TENG_AWS_EVENT_DATA_STORE_ID } from "../test-elsa-settings.common";
import { AuthenticatedUser } from "../../src/business/authenticated-user";
import { NotAuthorisedUpdateDataEgressRecords } from "../../src/business/exceptions/audit-authorisation";
import { AwsCloudTrailLakeService } from "../../src/business/services/aws/aws-cloudtrail-lake-service";
import { AwsEnabledServiceMock } from "./client-mocks";
import { IPLookupService } from "../../src/business/services/ip-lookup-service";

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

  it("Test recordCloudTrailLake", async () => {
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
      },
    ];

    await awsCloudTrailLakeService.recordCloudTrailLake({
      lakeResponse: mockData,
      releaseKey: testReleaseKey,
      description: "Object accessed",
      user: superAdminUser,
    });

    const deArr = await e
      .select(e.release.DataEgressRecord, (de) => ({
        ...de["*"],
        filter: e.op(de.release.releaseKey, "=", testReleaseKey),
      }))
      .run(edgeDbClient);

    expect(deArr.length).toEqual(1);

    const singleLog = deArr[0];
    expect(singleLog.egressBytes).toEqual(101);
  });

  it("Test getEventDataStoreIdFromReleaseKey", async () => {
    const awsCloudTrailLakeService = testContainer.resolve(
      AwsCloudTrailLakeService
    );

    const eventDataStoreIdArr =
      await awsCloudTrailLakeService.getEventDataStoreIdFromDatasetUris([
        TENG_URI,
      ]);

    expect(eventDataStoreIdArr).toEqual([TENG_AWS_EVENT_DATA_STORE_ID]);
  });

  it("Test fetchCloudTrailLakeLog", async () => {
    awsEnabledServiceMock.enable();

    const awsCloudTrailLakeService = testContainer.resolve(
      AwsCloudTrailLakeService
    );
    const KEY = "HG00096/HG00096.hard-filtered.vcf.gz";
    const BUCKET_NAME = "umccr-10g-data-dev";
    const mockData = [
      {
        eventTime: "2022-10-24 05:56:40.000",
        sourceIPAddress: "192.19.192.192",
        bucketName: BUCKET_NAME,
        key: KEY,
        bytesTransferredOut: "101.0",
        auditId: "id",
      },
    ];

    jest
      .spyOn(awsCloudTrailLakeService, "startCommandQueryCloudTrailLake")
      .mockImplementation(async () => "RANDOM_ID");
    jest
      .spyOn(awsCloudTrailLakeService, "getResultQueryCloudTrailLakeQuery")
      .mockImplementation(async () => mockData);
    await awsCloudTrailLakeService.fetchCloudTrailLakeLog({
      user: superAdminUser,
      releaseKey: testReleaseKey,
      datasetUrisArray: [TENG_URI],
    });

    const deArr = await e
      .select(e.release.DataEgressRecord, (de) => ({
        ...de["*"],
        filter: e.op(de.release.releaseKey, "=", testReleaseKey),
      }))
      .run(edgeDbClient);
    expect(deArr.length).toEqual(1);
    expect(deArr[0].egressBytes).toEqual(101);
  });

  it("Test unauthorised attempt ", async () => {
    const awsCloudTrailLakeService = testContainer.resolve(
      AwsCloudTrailLakeService
    );

    await expect(async () => {
      const result = await awsCloudTrailLakeService.fetchCloudTrailLakeLog({
        user: allowedMemberUser,
        releaseKey: testReleaseKey,
        datasetUrisArray: [TENG_URI],
      });
    }).rejects.toThrow(NotAuthorisedUpdateDataEgressRecords);
  });
});
