import { AuthenticatedUser } from "../../src/business/authenticated-user";
import assert from "assert";
import { beforeEachCommon } from "./releases.common";
import { registerTypes } from "../test-dependency-injection.common";
import { ReleaseService } from "../../src/business/services/release-service";
import { Client } from "edgedb";
import { ReleaseParticipationService } from "../../src/business/services/release-participation-service";
import _ from "lodash";

let edgeDbClient: Client;
let releaseService: ReleaseService;
let releaseParticipationService: ReleaseParticipationService;
let testReleaseKey: string;

let allowedDataOwnerUser: AuthenticatedUser;
let allowedPiUser: AuthenticatedUser;
let allowedMemberUser: AuthenticatedUser;
let notAllowedUser: AuthenticatedUser;

beforeAll(async () => {
  const testContainer = await registerTypes();

  edgeDbClient = testContainer.resolve("Database");
  releaseService = testContainer.resolve(ReleaseService);
  releaseParticipationService = testContainer.resolve(
    ReleaseParticipationService
  );
});

beforeEach(async () => {
  ({
    testReleaseKey,
    allowedDataOwnerUser,
    allowedPiUser,
    allowedMemberUser,
    notAllowedUser,
  } = await beforeEachCommon());
});

it("all the participants in a release are correctly returned", async () => {
  const result = await releaseParticipationService.getParticipants(
    allowedDataOwnerUser,
    testReleaseKey
  );

  expect(result).not.toBeNull();
  assert(result != null);

  // our demo release has 3 people involved
  expect(result.length).toBe(3);

  const comparableResults = _.map(result, (item) =>
    _.pick(item, ["role", "email", "subjectId", "displayName"])
  );

  expect(comparableResults).toContainEqual({
    role: "DataOwner",
    email: "admin@elsa.net",
    subjectId: "https://i-am-admin.org",
    displayName: "Test User Who Is Allowed Data Owner Access",
  });

  expect(comparableResults).toContainEqual({
    role: "Member",
    email: "subject4@elsa.net",
    subjectId: "http://subject4.com",
    displayName: "Test User Who Is Allowed Member Access",
  });

  expect(result[0]).toHaveProperty("lastLogin");
  expect(result[0]).toHaveProperty("id");
});

it("adding a user who doesn't yet exist makes a potential user who is returned with no last login", async () => {
  await releaseParticipationService.addParticipant(
    allowedDataOwnerUser,
    testReleaseKey,
    "test@example.com",
    "PI"
  );

  const result = await releaseParticipationService.getParticipants(
    allowedDataOwnerUser,
    testReleaseKey
  );

  expect(result).not.toBeNull();
  assert(result != null);

  // our potential user should come back
  expect(result.length).toBe(4);

  const noLastLoginArray = result.filter((x) => x.lastLogin === null);

  expect(noLastLoginArray).toHaveLength(1);
  expect(noLastLoginArray[0].role).toBe("PI");
});

it("real users and potential users can both have their roles altered", async () => {
  // add a potential user with Member role
  await releaseParticipationService.addParticipant(
    allowedDataOwnerUser,
    testReleaseKey,
    "test@example.com",
    "Member"
  );

  {
    const startingResult = await releaseParticipationService.getParticipants(
      allowedDataOwnerUser,
      testReleaseKey
    );

    expect(startingResult.filter((r) => r.role === "DataOwner")).toHaveLength(
      1
    );
    expect(startingResult.filter((r) => r.role === "PI")).toHaveLength(1);
    // we should have two Members
    expect(startingResult.filter((r) => r.role === "Member")).toHaveLength(2);
  }

  // upgrade our real user member to PI
  await releaseParticipationService.addParticipant(
    allowedDataOwnerUser,
    testReleaseKey,
    "subject4@elsa.net",
    "PI"
  );

  // upgrade our potential user to a PI as well
  await releaseParticipationService.addParticipant(
    allowedDataOwnerUser,
    testReleaseKey,
    "test@example.com",
    "PI"
  );

  {
    const result = await releaseParticipationService.getParticipants(
      allowedDataOwnerUser,
      testReleaseKey
    );

    expect(result).not.toBeNull();
    assert(result != null);

    expect(result.filter((r) => r.role === "DataOwner")).toHaveLength(1);
    // the two Members have been upgraded
    expect(result.filter((r) => r.role === "PI")).toHaveLength(3);
    expect(result.filter((r) => r.role === "Member")).toHaveLength(0);
  }
});

it("real users and potential users can be removed", async () => {
  // add a potential user with Member role
  const newMemberDbId = await releaseParticipationService.addParticipant(
    allowedDataOwnerUser,
    testReleaseKey,
    "test@example.com",
    "Member"
  );

  await releaseParticipationService.removeParticipant(
    allowedDataOwnerUser,
    testReleaseKey,
    allowedMemberUser.dbId
  );
  await releaseParticipationService.removeParticipant(
    allowedDataOwnerUser,
    testReleaseKey,
    newMemberDbId
  );

  {
    const result = await releaseParticipationService.getParticipants(
      allowedDataOwnerUser,
      testReleaseKey
    );

    expect(result).not.toBeNull();
    assert(result != null);

    expect(result.filter((r) => r.role === "DataOwner")).toHaveLength(1);
    // the two Members have been upgraded
    expect(result.filter((r) => r.role === "PI")).toHaveLength(1);
    expect(result.filter((r) => r.role === "Member")).toHaveLength(0);
  }
});

// TODO: should a user be able to alter themselves?
