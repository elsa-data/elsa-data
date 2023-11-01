import { AuthenticatedUser } from "../../../src/business/authenticated-user";
import { AuditEventService } from "../../../src/business/services/audit-event-service";
import * as edgedb from "edgedb";
import { registerTypes } from "../../test-dependency-injection.common";
import { beforeEachCommon } from "../commons/user.common";
import { addSeconds } from "date-fns";

let existingUser: AuthenticatedUser;
let auditEventService: AuditEventService;
let edgeDbClient: edgedb.Client;

const testContainer = registerTypes();

beforeEach(async () => {
  ({ existingUser, edgeDbClient } = await beforeEachCommon());

  auditEventService = testContainer.resolve(AuditEventService);
});

it("audit user instant", async () => {
  const start = new Date();

  const aeId = await auditEventService.startUserAuditEvent(
    existingUser.subjectId,
    existingUser.displayName,
    existingUser.dbId,
    "E",
    "Login",
    start,
    edgeDbClient,
  );

  await auditEventService.completeUserAuditEvent(
    aeId,
    0,
    start,
    new Date(),
    {
      message: "Message",
    },
    edgeDbClient,
  );

  const events = await auditEventService.getUserEntries(
    ["user"],
    existingUser,
    1000,
    0,
    false,
    "occurredDateTime",
    false,
    edgeDbClient,
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
  const aeId = await auditEventService.createUserAuditEvent(
    existingUser.dbId,
    existingUser.subjectId,
    existingUser.displayName,
    "E",
    "Login",
    { message: "Message" },
    8,
    new Date(),
    edgeDbClient,
  );

  const events = await auditEventService.getUserEntries(
    ["user"],
    existingUser,
    1000,
    0,
    false,
    "occurredDateTime",
    false,
    edgeDbClient,
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

  const aeId = await auditEventService.startUserAuditEvent(
    existingUser.subjectId,
    existingUser.displayName,
    existingUser.dbId,
    "E",
    "Login",
    start,
    edgeDbClient,
  );

  await auditEventService.completeUserAuditEvent(
    aeId,
    0,
    start,
    addSeconds(start, 96),
    {
      message: "Message",
    },
    edgeDbClient,
  );

  const events = await auditEventService.getUserEntries(
    ["user"],
    existingUser,
    1000,
    0,
    false,
    "occurredDateTime",
    false,
    edgeDbClient,
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
  const events = await auditEventService.getUserEntries(
    [],
    existingUser,
    1000,
    0,
    false,
    "occurredDateTime",
    false,
    edgeDbClient,
  );
  expect(events).toEqual(null);
});

it("get in progress user entries", async () => {
  const aeId = await auditEventService.startUserAuditEvent(
    existingUser.subjectId,
    existingUser.displayName,
    existingUser.dbId,
    "E",
    "Login",
    new Date(),
    edgeDbClient,
  );

  const events = await auditEventService.getUserEntries(
    ["user"],
    existingUser,
    1000,
    0,
    false,
    "occurredDateTime",
    false,
    edgeDbClient,
  );

  const auditEvent = events?.data?.find((element) => element.objectId === aeId);
  expect(auditEvent).toBeUndefined();
});
