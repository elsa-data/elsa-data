import { AuthenticatedUser } from "../../src/business/authenticated-user";
import { AuditEventService } from "../../src/business/services/audit-event-service";
import * as edgedb from "edgedb";
import { registerTypes } from "../test-dependency-injection.common";
import { beforeEachCommon } from "./user.common";
import { addSeconds } from "date-fns";

let existingUser: AuthenticatedUser;
let auditEventService: AuditEventService;
let edgeDbClient: edgedb.Client;

const testContainer = registerTypes();

beforeEach(async () => {
  ({ existingUser, edgeDbClient } = await beforeEachCommon());

  auditEventService = testContainer.resolve(AuditEventService);
});

it("audit system instant", async () => {
  const start = new Date();

  const aeId = await auditEventService.startSystemAuditEvent(
    "E",
    "Email",
    start,
    edgeDbClient
  );

  await auditEventService.completeSystemAuditEvent(
    aeId,
    0,
    start,
    new Date(),
    {
      message: "Message",
    },
    edgeDbClient
  );

  const events = await auditEventService.getSystemEntries(
    1000,
    0,
    "occurredDateTime",
    false,
    edgeDbClient
  );

  const auditEvent = events?.data?.find((element) => element.objectId === aeId);
  expect(auditEvent).toBeDefined();
  expect(auditEvent).toMatchObject({
    actionCategory: "E",
    actionDescription: "Email",
    hasDetails: true,
  });

  console.log(JSON.stringify(events));
});

it("audit system instant with create function", async () => {
  const aeId = await auditEventService.createSystemAuditEvent(
    "E",
    "Email",
    { message: "Message" },
    8,
    edgeDbClient
  );

  const events = await auditEventService.getSystemEntries(
    1000,
    0,
    "occurredDateTime",
    false,
    edgeDbClient
  );

  const auditEvent = events?.data?.find((element) => element.objectId === aeId);
  expect(auditEvent).toBeDefined();
  expect(auditEvent).toMatchObject({
    actionCategory: "E",
    actionDescription: "Email",
    hasDetails: true,
  });

  console.log(JSON.stringify(events));
});

it("audit system duration", async () => {
  const start = new Date();

  const aeId = await auditEventService.startSystemAuditEvent(
    "E",
    "Login",
    start,
    edgeDbClient
  );

  await auditEventService.completeSystemAuditEvent(
    aeId,
    0,
    start,
    addSeconds(start, 96),
    {
      message: "Message",
    },
    edgeDbClient
  );

  const events = await auditEventService.getSystemEntries(
    1000,
    0,
    "occurredDateTime",
    false,
    edgeDbClient
  );

  const auditEvent = events?.data?.find((element) => element.objectId === aeId);
  expect(auditEvent).toBeDefined();
  expect(auditEvent).toMatchObject({
    occurredDuration: "PT1M36S",
    actionCategory: "E",
    actionDescription: "Login",
    whoId: null,
    whoDisplayName: null,
    hasDetails: true,
  });

  console.log(JSON.stringify(events));
});

it("get in progress system entries", async () => {
  const aeId = await auditEventService.startSystemAuditEvent(
    "E",
    "Login",
    new Date(),
    edgeDbClient
  );

  const events = await auditEventService.getSystemEntries(
    1000,
    0,
    "occurredDateTime",
    false,
    edgeDbClient
  );

  const auditEvent = events?.data?.find((element) => element.objectId === aeId);
  expect(auditEvent).toBeUndefined();
});
