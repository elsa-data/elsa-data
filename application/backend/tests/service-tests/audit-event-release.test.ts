import { AuthenticatedUser } from "../../src/business/authenticated-user";
import * as edgedb from "edgedb";
import { beforeEachCommon } from "./releases.common";
import { registerTypes } from "../test-dependency-injection.common";
import { AuditEventService } from "../../src/business/services/audit-event-service";
import { addSeconds } from "date-fns";

let testReleaseKey: string;

let allowedAdministratorUser: AuthenticatedUser;
let allowedManagerUser: AuthenticatedUser;
let notAllowedUser: AuthenticatedUser;
let auditEventService: AuditEventService;
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

  auditEventService = testContainer.resolve(AuditEventService);
});

/**
 *
 */
it("audit release stuff instant", async () => {
  const start = new Date();

  const aeId = await auditEventService.startReleaseAuditEvent(
    allowedManagerUser,
    testReleaseKey,
    "C",
    "Made User",
    start,
    edgeDbClient
  );

  await auditEventService.completeReleaseAuditEvent(
    aeId,
    0,
    start,
    new Date(),
    {
      field: "A field",
    },
    edgeDbClient
  );

  const events = await auditEventService.getReleaseEntries(
    allowedManagerUser,
    testReleaseKey,
    1000,
    0,
    "occurredDateTime",
    false,
    edgeDbClient
  );

  console.log(JSON.stringify(events));
});

it("audit release stuff duration", async () => {
  const start = new Date();

  const aeId = await auditEventService.startReleaseAuditEvent(
    allowedManagerUser,
    testReleaseKey,
    "C",
    "Made User Over Time",
    start,
    edgeDbClient
  );

  await auditEventService.completeReleaseAuditEvent(
    aeId,
    0,
    start,
    addSeconds(start, 96),
    {
      field: "A field",
    },
    edgeDbClient
  );

  const events = await auditEventService.getReleaseEntries(
    allowedManagerUser,
    testReleaseKey,
    1000,
    0,
    "occurredDateTime",
    false,
    edgeDbClient
  );

  console.log(JSON.stringify(events));
});

it("audit release stuff duration", async () => {
  const start = new Date();

  const aeId = await auditEventService.startReleaseAuditEvent(
    allowedManagerUser,
    testReleaseKey,
    "C",
    "Made User Over Time",
    start,
    edgeDbClient
  );

  await auditEventService.completeReleaseAuditEvent(
    aeId,
    0,
    start,
    addSeconds(start, 96),
    {
      field: "A field",
    },
    edgeDbClient
  );

  const events = await auditEventService.getReleaseEntries(
    allowedManagerUser,
    testReleaseKey,
    1000,
    0,
    "occurredDateTime",
    false,
    edgeDbClient
  );

  console.log(JSON.stringify(events));
});

it("get entries with release filter", async () => {
  const start = new Date();

  const aeId = await auditEventService.startReleaseAuditEvent(
    allowedManagerUser,
    testReleaseKey,
    "C",
    "Made User Over Time",
    start,
    edgeDbClient
  );

  await auditEventService.completeReleaseAuditEvent(
    aeId,
    0,
    start,
    addSeconds(start, 96),
    {
      field: "A field",
    },
    edgeDbClient
  );

  const events = await auditEventService.getUserEntries(
    ["release"],
    allowedManagerUser,
    1000,
    0,
    false,
    "occurredDateTime",
    false,
    edgeDbClient
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
