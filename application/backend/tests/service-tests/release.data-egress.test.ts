import { AuthenticatedUser } from "../../src/business/authenticated-user";
import * as edgedb from "edgedb";
import e from "../../dbschema/edgeql-js";
import { beforeEachCommon } from "./releases.common";
import { registerTypes } from "../test-dependency-injection.common";
import { AuditEventService } from "../../src/business/services/audit-event-service";
import { ReleaseDataEgressService } from "../../src/business/services/releases/release-data-egress-service";
import { AwsCloudTrailLakeService } from "../../src/business/services/aws/aws-cloudtrail-lake-service";
import { NotAuthorisedUpdateDataEgressRecords } from "../../src/business/exceptions/audit-authorisation";
import { TENG_URI } from "../../src/test-data/dataset/insert-test-data-10g";

let testReleaseKey: string;

let allowedAdministratorUser: AuthenticatedUser;
let allowedManagerUser: AuthenticatedUser;
let notAllowedUser: AuthenticatedUser;
let auditLogService: AuditEventService;
let releaseDataEgressService: ReleaseDataEgressService;
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
});

it("audit data access log", async () => {
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
      await releaseDataEgressService.updateDataEgressRecordByReleaseKey(
        allowedAdministratorUser,
        testReleaseKey
      );
  }).rejects.toThrow(NotAuthorisedUpdateDataEgressRecords);
});
