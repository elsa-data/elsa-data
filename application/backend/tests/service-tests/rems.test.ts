import { AuthenticatedUser } from "../../src/business/authenticated-user";
import { beforeEachCommon } from "./releases.common";
import { registerTypes } from "./setup";
import { AuditLogService } from "../../src/business/services/audit-log-service";
import { addSeconds } from "date-fns";
import { RemsService } from "../../src/business/services/rems-service";

let remsService: RemsService;
let testReleaseId: string;

let allowedDataOwnerUser: AuthenticatedUser;
let allowedPiUser: AuthenticatedUser;
let notAllowedUser: AuthenticatedUser;

beforeAll(async () => {
  const testContainer = await registerTypes();

  remsService = testContainer.resolve(RemsService);
});

beforeEach(async () => {
  ({ testReleaseId, allowedDataOwnerUser, allowedPiUser, notAllowedUser } =
    await beforeEachCommon());
});

/**
 *
 */
it("sync", async () => {
  const newReleases = await remsService.detectNewReleases();

  console.log(newReleases);

  const a = await remsService.startNewRelease(7);

  console.log(JSON.stringify(a, null, 2));
});
