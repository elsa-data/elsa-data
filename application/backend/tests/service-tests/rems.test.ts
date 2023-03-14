import { AuthenticatedUser } from "../../src/business/authenticated-user";
import { beforeEachCommon } from "./releases.common";
import { registerTypes } from "./setup";
import { RemsService } from "../../src/business/services/rems-service";

let remsService: RemsService;
let testReleaseKey: string;

let superAdminUser: AuthenticatedUser;
let allowedPiUser: AuthenticatedUser;
let notAllowedUser: AuthenticatedUser;

beforeAll(async () => {
  const testContainer = await registerTypes();

  remsService = testContainer.resolve(RemsService);
});

beforeEach(async () => {
  ({ testReleaseKey, superAdminUser, allowedPiUser, notAllowedUser } =
    await beforeEachCommon());
});

/**
 *
 */
xit("sync", async () => {
  const newReleases = await remsService.detectNewReleases(superAdminUser);

  console.log(newReleases);

  const a = await remsService.startNewRelease(superAdminUser, 7);

  console.log(JSON.stringify(a, null, 2));
});
