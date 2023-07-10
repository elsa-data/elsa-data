import { AuthenticatedUser } from "../../src/business/authenticated-user";
import { beforeEachCommon } from "./commons/releases.common";
import { registerTypes } from "../test-dependency-injection.common";
import { RemsService } from "../../src/business/services/dacs/rems-service";
import {
  ReleaseCreateError,
  ReleaseViewError,
} from "../../src/business/exceptions/release-authorisation";
import { DacRemsType } from "../../src/config/config-schema-dac";

let remsService: RemsService;
let testReleaseKey: string;

let superAdminUser: AuthenticatedUser;
let allowedManagerUser: AuthenticatedUser;
let notAllowedUser: AuthenticatedUser;

const testContainer = registerTypes();

const configDac: DacRemsType = {
  id: "aaa",
  type: "rems",
  description: "A description",
  url: "https://somewhere.com",
  botUser: "abot",
  botKey: "akey" as any,
};

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
  const newReleases = await remsService.detectNewReleases(
    superAdminUser,
    configDac
  );

  console.log(newReleases);

  const a = await remsService.startNewRelease(superAdminUser, configDac, 7);

  console.log(JSON.stringify(a, null, 2));
});

/**
 *
 */
it("Test non-allowed user to detect new release.", async () => {
  await expect(async () => {
    const newReleases = await remsService.detectNewReleases(
      notAllowedUser,
      configDac
    );
  }).rejects.toThrow(ReleaseViewError);
});

it("Test non-allowed user to create new release.", async () => {
  await expect(async () => {
    const newReleases = await remsService.startNewRelease(
      notAllowedUser,
      configDac,
      1
    );
  }).rejects.toThrow(ReleaseCreateError);
});
