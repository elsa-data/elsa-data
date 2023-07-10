import { AuthenticatedUser } from "../../../src/business/authenticated-user";
import * as edgedb from "edgedb";
import e from "../../../dbschema/edgeql-js";
import { beforeEachCommon } from "../commons/releases.common";
import { registerTypes } from "../../test-dependency-injection.common";
import { AuditEventService } from "../../../src/business/services/audit-event-service";
import { ReleaseDataEgressService } from "../../../src/business/services/releases/release-data-egress-service";
import {
  getLatestEgressRecordUpdate,
  IQueryEgressRecordsProvider,
  ReleaseEgressRecords,
  updateDataEgressRecordByReleaseKey,
} from "../../../src/business/services/releases/helpers/release-data-egress-helper";
import { NotAuthorisedUpdateDataEgressRecords } from "../../../src/business/exceptions/audit-authorisation";
import { IPLookupService } from "../../../src/business/services/ip-lookup-service";

let testReleaseKey: string;

let allowedAdministratorUser: AuthenticatedUser;
let allowedManagerUser: AuthenticatedUser;
let notAllowedUser: AuthenticatedUser;
let auditLogService: AuditEventService;
let releaseDataEgressService: ReleaseDataEgressService;
let iPLookupService: IPLookupService;

let edgeDbClient: edgedb.Client;

const testContainer = registerTypes();

beforeEach(async () => {
  ({
    testReleaseKey,
    allowedAdministratorUser,
    allowedManagerUser,
    notAllowedUser,
    edgeDbClient,
  } = await beforeEachCommon(testContainer));

  releaseDataEgressService = testContainer.resolve(ReleaseDataEgressService);
  iPLookupService = testContainer.resolve(IPLookupService);
});

it("test audit data access log", async () => {
  const start = new Date();

  // Pre-insert file storage
  const fileUrl = "s3://elsa-bucket/PRM001.fastq.gz";
  await e
    .insert(e.storage.File, {
      url: fileUrl,
      size: 123,
      checksums: [{ type: "MD5", value: "abcde123" }],
    })
    .run(edgeDbClient);

  await e
    .update(e.release.Release, (r) => ({
      filter: e.op(testReleaseKey, "=", r.releaseKey),
      set: {
        dataEgressRecord: {
          "+=": e.insert(e.release.DataEgressRecord, {
            auditId: "abcd-defg-hijk-lmno",
            egressId: "egress-01",
            occurredDateTime: e.datetime(new Date()),
            description: "Accessed via pre-signed URL",
            sourceIpAddress: "123.123.123.123",
            sourceLocation: {
              city: "Melbourne",
              country: "Australia",
              region: "AU",
            },
            egressBytes: 10188721080,
            fileUrl: fileUrl,
            fileSize: 30,
          }),
        },
      },
    }))
    .run(edgeDbClient);

  const res = await releaseDataEgressService.getDataEgressRecordsByReleaseKey(
    allowedAdministratorUser,
    testReleaseKey,
    10,
    0
  );
  const firstData = res.data?.length ? res.data[0] : null;

  expect(res.total).toBe(1);
  expect(firstData?.fileUrl).toBe(fileUrl);
});

it("test unauthorised attempt", async () => {
  await expect(async () => {
    const result =
      await releaseDataEgressService.updateDataEgressRecordsByReleaseKey(
        allowedAdministratorUser,
        testReleaseKey
      );
  }).rejects.toThrow(NotAuthorisedUpdateDataEgressRecords);
});

it("test get last egress update attempt function", async () => {
  const release = await e
    .select(e.release.Release, (r) => ({
      filter_single: e.op(testReleaseKey, "=", r.releaseKey),
      created: true,
      lastDataEgressQueryTimestamp: true,
    }))
    .assert_single()
    .run(edgeDbClient);
  const latestEgressUpdateDate =
    release?.lastDataEgressQueryTimestamp ?? release?.created;

  const funcRes = await edgeDbClient.transaction(async (tx) => {
    return await getLatestEgressRecordUpdate(tx, testReleaseKey);
  });

  expect(funcRes.toISOString()).toBe(latestEgressUpdateDate?.toISOString());
});

it("test update egress function", async () => {
  const KEY = "HG00096/HG00096.hard-filtered.vcf.gz";
  const BUCKET_NAME = "umccr-10g-data-dev";
  const mockData: ReleaseEgressRecords[] = [
    {
      releaseKey: testReleaseKey,
      description: "accessed via mock client",
      auditId: "audit-01",
      egressId: "egress-01",

      occurredDateTime: new Date(),
      sourceIpAddress: "192.19.192.192",

      egressBytes: parseInt("101"),
      fileUrl: `s3://${BUCKET_NAME}/${KEY}`,
    },
  ];

  class MockQueryEgressRecordsProvider implements IQueryEgressRecordsProvider {
    async getNewEgressRecords(props: {
      releaseKey: string;
      datasetUrisArray: string[];
      currentDate: Date;
      lastEgressUpdate?: Date | undefined;
    }): Promise<ReleaseEgressRecords[]> {
      // Also check for idempotent
      return [...mockData, ...mockData];
    }
  }
  jest
    .spyOn(iPLookupService, "getLocationByIp")
    .mockImplementation(() => undefined);
  await edgeDbClient.transaction(async (tx) => {
    const result = await updateDataEgressRecordByReleaseKey({
      tx,
      dataEgressQueryService: new MockQueryEgressRecordsProvider(),
      ipLookupService: iPLookupService,
      releaseKey: testReleaseKey,
    });
  });

  // Query the new Egress Records
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
