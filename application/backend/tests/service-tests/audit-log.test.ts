import { AuthenticatedUser } from "../../src/business/authenticated-user";
import * as edgedb from "edgedb";
import e from "../../dbschema/edgeql-js";
import { beforeEachCommon } from "./releases.common";
import { registerTypes } from "./setup";
import { AuditLogService } from "../../src/business/services/audit-log-service";
import { addSeconds } from "date-fns";

let testReleaseId: string;

let allowedDataOwnerUser: AuthenticatedUser;
let allowedPiUser: AuthenticatedUser;
let notAllowedUser: AuthenticatedUser;
let auditLogService: AuditLogService;
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

  auditLogService = testContainer.resolve(AuditLogService);
});

/**
 *
 */
it("audit release stuff instant", async () => {
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

  const events = await auditLogService.getReleaseEntries(
    edgeDbClient,
    allowedPiUser,
    testReleaseId,
    1000,
    0
  );

  console.log(JSON.stringify(events));
});

it("audit release stuff duration", async () => {
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

  const events = await auditLogService.getReleaseEntries(
    edgeDbClient,
    allowedPiUser,
    testReleaseId,
    1000,
    0
  );

  console.log(JSON.stringify(events));
});

it("audit user instant", async () => {
  const start = new Date();

  const aeId = await auditLogService.startUserAuditEvent(
    edgeDbClient,
    allowedPiUser.subjectId,
    allowedPiUser.displayName,
    allowedPiUser.dbId,
    "E",
    "Login",
    start
  );

  await auditLogService.completeReleaseAuditEvent(
    edgeDbClient,
    aeId,
    0,
    start,
    new Date(),
    {
      message: "Message",
    }
  );

  const events = await auditLogService.getUserEntries(
    edgeDbClient,
    allowedPiUser,
    1000,
    0
  );

  const auditEvent = events?.data?.find((element) => element.objectId === aeId);
  expect(auditEvent).toBeDefined();
  expect(auditEvent).toMatchObject({
    occurredDuration: "0",
    actionCategory: "E",
    actionDescription: "Login",
    whoId: allowedPiUser.subjectId,
    whoDisplayName: allowedPiUser.displayName,
    hasDetails: true,
  });

  console.log(JSON.stringify(events));
});

it("audit user instant with create function", async () => {
  const aeId = await auditLogService.createUserAuditEvent(
    edgeDbClient,
    allowedPiUser.dbId,
    allowedPiUser.subjectId,
    allowedPiUser.displayName,
    "E",
    "Login",
    { message: "message" },
    8
  );

  const events = await auditLogService.getUserEntries(
    edgeDbClient,
    allowedPiUser,
    1000,
    0
  );

  const auditEvent = events?.data?.find((element) => element.objectId === aeId);
  expect(auditEvent).toBeDefined();
  expect(auditEvent).toMatchObject({
    occurredDuration: "0",
    actionCategory: "E",
    actionDescription: "Login",
    whoId: allowedPiUser.subjectId,
    whoDisplayName: allowedPiUser.displayName,
    hasDetails: true,
  });

  console.log(JSON.stringify(events));
});

it("audit user duration", async () => {
  const start = new Date();

  const aeId = await auditLogService.startUserAuditEvent(
    edgeDbClient,
    allowedPiUser.subjectId,
    allowedPiUser.displayName,
    allowedPiUser.dbId,
    "E",
    "Login",
    start
  );

  await auditLogService.completeUserAuditEvent(
    edgeDbClient,
    aeId,
    0,
    start,
    addSeconds(start, 96),
    {
      message: "Message",
    }
  );

  const events = await auditLogService.getUserEntries(
    edgeDbClient,
    allowedPiUser,
    1000,
    0
  );

  const auditEvent = events?.data?.find((element) => element.objectId === aeId);
  expect(auditEvent).toBeDefined();
  expect(auditEvent).toMatchObject({
    occurredDuration: "96",
    actionCategory: "E",
    actionDescription: "Login",
    whoId: allowedPiUser.subjectId,
    whoDisplayName: allowedPiUser.displayName,
    hasDetails: true,
  });

  console.log(JSON.stringify(events));
});

it("audit release stuff duration", async () => {
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

  const events = await auditLogService.getReleaseEntries(
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
    whoId: "123.123.12.123",
    whoDisplayName: "Melbourne, VIC, AU",
    egressBytes: 123456,
    description: "Test data access log.",
    date: new Date("2022-10-24 05:56:40.000"),
    releaseId: testReleaseId,
  });
});
