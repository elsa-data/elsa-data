import { AuthenticatedUser } from "../../src/business/authenticated-user";
import * as edgedb from "edgedb";
import e from "../../dbschema/edgeql-js";
import { beforeEachCommon } from "./releases.common";
import { registerTypes } from "./setup";
import { ReleaseAuditLogService } from "../../src/business/services/release-audit-log-service";
import { addSeconds } from "date-fns";

let testReleaseId: string;

let allowedDataOwnerUser: AuthenticatedUser;
let allowedPiUser: AuthenticatedUser;
let notAllowedUser: AuthenticatedUser;
let auditLogService: ReleaseAuditLogService;
let edgeDbClient: edgedb.Client;

beforeEach(async () => {
  const testContainer = await registerTypes();

  ({
    testReleaseId,
    allowedDataOwnerUser,
    allowedPiUser,
    notAllowedUser,
    edgeDbClient,
  } = await beforeEachCommon());

  auditLogService = testContainer.resolve(ReleaseAuditLogService);
});

/**
 *
 */
it("audit stuff instant", async () => {
  const start = new Date();

  const aeId = await auditLogService.startReleaseAuditEvent(
    edgeDbClient,
    allowedPiUser,
    testReleaseId,
    "C",
    "Made User",
    start
  );

  await auditLogService.completeReleaseAuditEvent(
    edgeDbClient,
    aeId,
    0,
    start,
    new Date(),
    {
      field: "A field",
    }
  );

  const events = await auditLogService.getEntries(
    edgeDbClient,
    allowedPiUser,
    testReleaseId,
    1000,
    0
  );

  console.log(JSON.stringify(events));
});

it("audit stuff duration", async () => {
  const start = new Date();

  const aeId = await auditLogService.startReleaseAuditEvent(
    edgeDbClient,
    allowedPiUser,
    testReleaseId,
    "C",
    "Made User Over Time",
    start
  );

  await auditLogService.completeReleaseAuditEvent(
    edgeDbClient,
    aeId,
    0,
    start,
    addSeconds(start, 96),
    {
      field: "A field",
    }
  );

  const events = await auditLogService.getEntries(
    edgeDbClient,
    allowedPiUser,
    testReleaseId,
    1000,
    0
  );

  console.log(JSON.stringify(events));
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

  const aeId = await auditLogService.startReleaseAuditEvent(
    edgeDbClient,
    allowedPiUser,
    testReleaseId,
    "C",
    "Data access release",
    start
  );
  const se = await auditLogService.updateDataAccessAuditEvent({
    executor: edgeDbClient,
    fileUrl: fileUrl,
    who: "123.123.12.123",
    egressBytes: 123456,
    description: "Test data access log.",
    date: new Date("2022-10-24 05:56:40.000"),
    releaseId: testReleaseId,
  });
});
