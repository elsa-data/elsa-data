import { AuthenticatedUser } from "../../src/business/authenticated-user";
import * as edgedb from "edgedb";
import e from "../../dbschema/edgeql-js";
import { beforeEachCommon } from "./releases.common";
import { registerTypes } from "../test-dependency-injection.common";
import { AuditLogService } from "../../src/business/services/audit-log-service";
import { addSeconds } from "date-fns";

let testReleaseKey: string;

let allowedAdministratorUser: AuthenticatedUser;
let allowedManagerUser: AuthenticatedUser;
let notAllowedUser: AuthenticatedUser;
let auditLogService: AuditLogService;
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

  auditLogService = testContainer.resolve(AuditLogService);
});

/**
 *
 */
it("audit release stuff instant", async () => {
  const start = new Date();

  const aeId = await auditLogService.startReleaseAuditEvent(
    edgeDbClient,
    allowedManagerUser,
    testReleaseKey,
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

  const events = await auditLogService.getReleaseEntries(
    edgeDbClient,
    allowedManagerUser,
    testReleaseKey,
    1000,
    0
  );

  console.log(JSON.stringify(events));
});

it("audit release stuff duration", async () => {
  const start = new Date();

  const aeId = await auditLogService.startReleaseAuditEvent(
    edgeDbClient,
    allowedManagerUser,
    testReleaseKey,
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

  const events = await auditLogService.getReleaseEntries(
    edgeDbClient,
    allowedManagerUser,
    testReleaseKey,
    1000,
    0
  );

  console.log(JSON.stringify(events));
});

it("audit release stuff duration", async () => {
  const start = new Date();

  const aeId = await auditLogService.startReleaseAuditEvent(
    edgeDbClient,
    allowedManagerUser,
    testReleaseKey,
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

  const events = await auditLogService.getReleaseEntries(
    edgeDbClient,
    allowedManagerUser,
    testReleaseKey,
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
    allowedManagerUser,
    testReleaseKey,
    "C",
    "Data access release",
    start
  );
  const se = await auditLogService.updateDataAccessAuditEvent({
    executor: edgeDbClient,
    fileUrl: fileUrl,
    whoId: "123.123.12.123",
    whoDisplayName: "Melbourne, VIC, AU",
    egressBytes: 123456,
    description: "Test data access log.",
    date: new Date("2022-10-24 05:56:40.000"),
    releaseKey: testReleaseKey,
  });
});

it("get entries with release filter", async () => {
  const start = new Date();

  const aeId = await auditLogService.startReleaseAuditEvent(
    edgeDbClient,
    allowedManagerUser,
    testReleaseKey,
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

  const events = await auditLogService.getUserEntries(
    edgeDbClient,
    ["release"],
    allowedManagerUser,
    1000,
    0
  );

  const auditEvent = events?.data?.find((element) => element.objectId === aeId);
  expect(auditEvent).toBeDefined();
  expect(auditEvent).toMatchObject({
    occurredDuration: "PT1M36S",
    actionCategory: "C",
    actionDescription: "Made User Over Time",
    whoId: allowedManagerUser.subjectId,
    whoDisplayName: allowedManagerUser.displayName,
    hasDetails: true,
  });
});
