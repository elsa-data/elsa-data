import { AuthenticatedUser } from "../../src/business/authenticated-user";
import { AuditEventService } from "../../src/business/services/audit-event-service";
import * as edgedb from "edgedb";
import { registerTypes } from "../test-dependency-injection.common";
import { beforeEachCommon } from "./user.common";
import { addSeconds } from "date-fns";

let existingUser: AuthenticatedUser;
let auditLogService: AuditEventService;
let edgeDbClient: edgedb.Client;

const testContainer = registerTypes();

beforeEach(async () => {
  ({ existingUser, edgeDbClient } = await beforeEachCommon());

  auditLogService = testContainer.resolve(AuditEventService);
});

it("audit user instant", async () => {
  const start = new Date();

  const aeId = await auditLogService.startUserAuditEvent(
    edgeDbClient,
    existingUser.subjectId,
    existingUser.displayName,
    existingUser.dbId,
    "E",
    "Login",
    start
  );

  await auditLogService.completeUserAuditEvent(
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
    ["user"],
    existingUser,
    1000,
    0
  );

  const auditEvent = events?.data?.find((element) => element.objectId === aeId);
  expect(auditEvent).toBeDefined();
  expect(auditEvent).toMatchObject({
    actionCategory: "E",
    actionDescription: "Login",
    whoId: existingUser.subjectId,
    whoDisplayName: existingUser.displayName,
    hasDetails: true,
  });

  console.log(JSON.stringify(events));
});

it("audit user instant with create function", async () => {
  const aeId = await auditLogService.createUserAuditEvent(
    edgeDbClient,
    existingUser.dbId,
    existingUser.subjectId,
    existingUser.displayName,
    "E",
    "Login",
    { message: "Message" },
    8
  );

  const events = await auditLogService.getUserEntries(
    edgeDbClient,
    ["user"],
    existingUser,
    1000,
    0
  );

  const auditEvent = events?.data?.find((element) => element.objectId === aeId);
  expect(auditEvent).toBeDefined();
  expect(auditEvent).toMatchObject({
    actionCategory: "E",
    actionDescription: "Login",
    whoId: existingUser.subjectId,
    whoDisplayName: existingUser.displayName,
    hasDetails: true,
  });

  console.log(JSON.stringify(events));
});

it("audit user duration", async () => {
  const start = new Date();

  const aeId = await auditLogService.startUserAuditEvent(
    edgeDbClient,
    existingUser.subjectId,
    existingUser.displayName,
    existingUser.dbId,
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
    ["user"],
    existingUser,
    1000,
    0
  );

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

it("get entries with no filter", async () => {
  const events = await auditLogService.getUserEntries(
    edgeDbClient,
    [],
    existingUser,
    1000,
    0
  );
  expect(events).toEqual({ data: [], total: 0 });
});
