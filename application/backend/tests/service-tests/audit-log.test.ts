import { AuthenticatedUser } from "../../src/business/authenticated-user";
import * as edgedb from "edgedb";
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
  ({
    testReleaseId,
    allowedDataOwnerUser,
    allowedPiUser,
    notAllowedUser,
    edgeDbClient,
  } = await beforeEachCommon());

  const testContainer = await registerTypes();

  auditLogService = testContainer.resolve(AuditLogService);
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
