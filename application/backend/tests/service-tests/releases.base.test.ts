import { AuthenticatedUser } from "../../src/business/authenticated-user";
import assert from "assert";
import LinkHeader from "http-link-header";
import { beforeEachCommon } from "./releases.common";
import { ReleasesService } from "../../src/business/services/releases-service";
import { AwsPresignedUrlsService } from "../../src/business/services/aws-presigned-urls-service";
import { registerTypes } from "./setup";

const testContainer = registerTypes();

const releasesService = testContainer.resolve(ReleasesService);
const awsPresignedUrlsService = testContainer.resolve(AwsPresignedUrlsService);

let testReleaseId: string;

let allowedDataOwnerUser: AuthenticatedUser;
let allowedPiUser: AuthenticatedUser;
let notAllowedUser: AuthenticatedUser;

beforeEach(async () => {
  testContainer.clearInstances();

  ({ testReleaseId, allowedDataOwnerUser, allowedPiUser, notAllowedUser } =
    await beforeEachCommon());
});

/**
 *
 */
it("allowed users can get release data", async () => {
  const result = await releasesService.get(allowedPiUser, testReleaseId);

  expect(result).not.toBeNull();
  assert(result != null);
});

/**
 *
 */
it("not allowed users cannot get release data", async () => {
  await expect(async () => {
    const result = await releasesService.get(notAllowedUser, testReleaseId);
  }).rejects.toThrow(Error);
});

it("basic release data is present", async () => {
  const result = await releasesService.get(allowedPiUser, testReleaseId);

  expect(result).not.toBeNull();
  assert(result != null);

  expect(result.applicationDacTitle).toBe("A Study in Many Parts");
  expect(result.runningJob).toBeUndefined();
  expect(result.applicationDacDetails).toBe(
    "So this is all that we have brought over not coded"
  );
});

it("aa", async () => {
  const l = new LinkHeader();

  l.set({ rel: "next", uri: "http://example.com/next" });

  console.log(l.toString());
});

it("bb", async () => {
  await awsPresignedUrlsService.getPresigned(allowedPiUser, testReleaseId);
});
