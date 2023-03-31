import { AuthenticatedUser } from "../../src/business/authenticated-user";
import { beforeEachCommon } from "./releases.common";
import { registerTypes } from "../test-dependency-injection.common";
import { RemsService } from "../../src/business/services/rems-service";
import {
  ReleaseCreateError,
  ReleaseViewError,
} from "../../src/business/exceptions/release-authorisation";

let remsService: RemsService;
let testReleaseKey: string;

let superAdminUser: AuthenticatedUser;
let allowedManagerUser: AuthenticatedUser;
let notAllowedUser: AuthenticatedUser;

const testContainer = registerTypes();

beforeAll(async () => {
  remsService = testContainer.resolve(RemsService);
});

beforeEach(async () => {
  ({ testReleaseKey, superAdminUser, allowedManagerUser, notAllowedUser } =
    await beforeEachCommon(testContainer));
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

/**
 *
 */
it("Test non-allowed user to detect new release.", async () => {
  await expect(async () => {
    const newReleases = await remsService.detectNewReleases(notAllowedUser);
  }).rejects.toThrow(ReleaseViewError);
});

it("Test non-allowed user to create new release.", async () => {
  await expect(async () => {
    const newReleases = await remsService.startNewRelease(notAllowedUser, 1);
  }).rejects.toThrow(ReleaseCreateError);
});
