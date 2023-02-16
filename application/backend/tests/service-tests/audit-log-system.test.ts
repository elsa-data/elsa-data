import { AuthenticatedUser } from "../../src/business/authenticated-user";
import { AuditLogService } from "../../src/business/services/audit-log-service";
import * as edgedb from "edgedb";
import { registerTypes } from "./setup";
import { beforeEachCommon } from "./user.common";
import { addSeconds } from "date-fns";

let existingUser: AuthenticatedUser;
let auditLogService: AuditLogService;
let edgeDbClient: edgedb.Client;

beforeEach(async () => {
  const testContainer = await registerTypes();

  ({ existingUser, edgeDbClient } = await beforeEachCommon());

  auditLogService = testContainer.resolve(AuditLogService);
});

it("audit user instant", async () => {
  const start = new Date();

  const aeId = await auditLogService.startSystemAuditEvent(
    edgeDbClient,
    "E",
    "Email",
    start
  );

  await auditLogService.completeSystemAuditEvent(
    edgeDbClient,
    aeId,
    0,
    start,
    new Date(),
    {
      message: "Message",
    }
  );

  const events = await auditLogService.getSystemEntries(edgeDbClient, 1000, 0);

  const auditEvent = events?.data?.find((element) => element.objectId === aeId);
  expect(auditEvent).toBeDefined();
  expect(auditEvent).toMatchObject({
    actionCategory: "E",
    actionDescription: "Email",
    hasDetails: true,
  });

  console.log(JSON.stringify(events));
});

it("audit user instant with create function", async () => {
  const aeId = await auditLogService.createSystemAuditEvent(
    edgeDbClient,
    "E",
    "Email",
    { message: "Message" },
    8
  );

  const events = await auditLogService.getSystemEntries(edgeDbClient, 1000, 0);

  const auditEvent = events?.data?.find((element) => element.objectId === aeId);
  expect(auditEvent).toBeDefined();
  expect(auditEvent).toMatchObject({
    actionCategory: "E",
    actionDescription: "Email",
    hasDetails: true,
  });

  console.log(JSON.stringify(events));
});

it("audit user duration", async () => {
  const start = new Date();

  const aeId = await auditLogService.startSystemAuditEvent(
    edgeDbClient,
    "E",
    "Login",
    start
  );

  await auditLogService.completeSystemAuditEvent(
    edgeDbClient,
    aeId,
    0,
    start,
    addSeconds(start, 96),
    {
      message: "Message",
    }
  );

  const events = await auditLogService.getSystemEntries(edgeDbClient, 1000, 0);

  const auditEvent = events?.data?.find((element) => element.objectId === aeId);
  expect(auditEvent).toBeDefined();
  expect(auditEvent).toMatchObject({
    occurredDuration: "PT1M36S",
    actionCategory: "E",
    actionDescription: "Login",
    whoId: existingUser.subjectId,
    whoDisplayName: existingUser.displayName,
    hasDetails: true,
  });

  console.log(JSON.stringify(events));
});
