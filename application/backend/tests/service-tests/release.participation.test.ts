import { AuthenticatedUser } from "../../src/business/authenticated-user";
import assert from "assert";
import { beforeEachCommon } from "./releases.common";
import { registerTypes } from "../test-dependency-injection.common";
import { ReleaseService } from "../../src/business/services/release-service";
import { Client } from "edgedb";
import { ReleaseParticipationService } from "../../src/business/services/release-participation-service";
import _ from "lodash";
import { ReleaseParticipationPermissionError } from "../../src/business/exceptions/release-participation";

let edgeDbClient: Client;
let releaseService: ReleaseService;
let releaseParticipationService: ReleaseParticipationService;
let testReleaseKey: string;

let superAdminUser: AuthenticatedUser;
let allowedAdministratorUser: AuthenticatedUser;
let allowedManagerUser: AuthenticatedUser;
let allowedMemberUser: AuthenticatedUser;
let notAllowedUser: AuthenticatedUser;

const testContainer = registerTypes();

beforeAll(async () => {
  edgeDbClient = testContainer.resolve("Database");
  releaseService = testContainer.resolve(ReleaseService);
  releaseParticipationService = testContainer.resolve(
    ReleaseParticipationService
  );
});

beforeEach(async () => {
  ({
    testReleaseKey,
    superAdminUser,
    allowedAdministratorUser,
    allowedManagerUser,
    allowedMemberUser,
    notAllowedUser,
  } = await beforeEachCommon(testContainer));
});

it("all the participants in a release are correctly returned", async () => {
  const result = await releaseParticipationService.getParticipants(
    superAdminUser,
    testReleaseKey
  );

  expect(result).not.toBeNull();
  assert(result != null);

  // our demo release has 4 people involved
  expect(result.length).toBe(4);

  const comparableResults = _.map(result, (item) =>
    _.pick(item, ["role", "email", "subjectId", "displayName"])
  );

  expect(comparableResults).toContainEqual({
    role: "Administrator",
    email: "admin@elsa.net",
    subjectId: "https://i-am-admin.org",
    displayName: "Test User Who Is Allowed Administrator Access",
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
  await releaseParticipationService.addOrInsertParticipant(
    superAdminUser,
    testReleaseKey,
    "test@example.com",
    "Manager"
  );

  const result = await releaseParticipationService.getParticipants(
    superAdminUser,
    testReleaseKey
  );

  expect(result).not.toBeNull();
  assert(result != null);

  // our potential user should come back
  expect(result.length).toBe(5);

  const noLastLoginArray = result.filter((x) => x.lastLogin === null);

  expect(noLastLoginArray).toHaveLength(1);
  expect(noLastLoginArray[0].role).toBe("Manager");
});

it("real users and potential users can both have their roles altered", async () => {
  // add a potential user with Member role
  await releaseParticipationService.addOrInsertParticipant(
    superAdminUser,
    testReleaseKey,
    "test@example.com",
    "Member"
  );

  {
    const startingResult = await releaseParticipationService.getParticipants(
      superAdminUser,
      testReleaseKey
    );

    expect(
      startingResult.filter((r) => r.role === "Administrator")
    ).toHaveLength(2);
    expect(startingResult.filter((r) => r.role === "Manager")).toHaveLength(1);
    // we should have two Members
    expect(startingResult.filter((r) => r.role === "Member")).toHaveLength(2);
  }

  // upgrade our real user member to Manager
  await releaseParticipationService.addOrInsertParticipant(
    superAdminUser,
    testReleaseKey,
    "subject4@elsa.net",
    "Manager"
  );

  // upgrade our potential user to a Manager as well
  await releaseParticipationService.addOrInsertParticipant(
    superAdminUser,
    testReleaseKey,
    "test@example.com",
    "Manager"
  );

  {
    const result = await releaseParticipationService.getParticipants(
      superAdminUser,
      testReleaseKey
    );

    expect(result).not.toBeNull();
    assert(result != null);

    expect(result.filter((r) => r.role === "Administrator")).toHaveLength(2);
    // the two Members have been upgraded
    expect(result.filter((r) => r.role === "Manager")).toHaveLength(3);
    expect(result.filter((r) => r.role === "Member")).toHaveLength(0);
  }
});

it("real users and potential users can be removed", async () => {
  // add a potential user with Member role
  const newMemberDbId =
    await releaseParticipationService.addOrInsertParticipant(
      allowedAdministratorUser,
      testReleaseKey,
      "test@example.com",
      "Member"
    );

  await releaseParticipationService.removeParticipant(
    allowedAdministratorUser,
    testReleaseKey,
    allowedMemberUser.dbId
  );
  await releaseParticipationService.removeParticipant(
    allowedAdministratorUser,
    testReleaseKey,
    newMemberDbId
  );

  {
    const result = await releaseParticipationService.getParticipants(
      superAdminUser,
      testReleaseKey
    );

    expect(result).not.toBeNull();
    assert(result != null);

    expect(result.filter((r) => r.role === "Administrator")).toHaveLength(2);
    // the two Members have been upgraded
    expect(result.filter((r) => r.role === "Manager")).toHaveLength(1);
    expect(result.filter((r) => r.role === "Member")).toHaveLength(0);
  }
});

it("lower roles cannot remove/modify higher participant role", async () => {
  {
    // Throw error when member try to remove/modify manager
    await expect(async () => {
      await releaseParticipationService.removeParticipant(
        allowedMemberUser,
        testReleaseKey,
        allowedManagerUser.dbId
      );
    }).rejects.toThrow(ReleaseParticipationPermissionError);
    await expect(async () => {
      await releaseParticipationService.addOrInsertParticipant(
        allowedMemberUser,
        testReleaseKey,
        "admin@elsa.org",
        "Manager"
      );
    }).rejects.toThrow(ReleaseParticipationPermissionError);
  }

  {
    // Throw error when manager try to remove/modify manager
    await expect(async () => {
      await releaseParticipationService.removeParticipant(
        allowedManagerUser,
        testReleaseKey,
        allowedAdministratorUser.dbId
      );
    }).rejects.toThrow(ReleaseParticipationPermissionError);
    await expect(async () => {
      await releaseParticipationService.addOrInsertParticipant(
        allowedManagerUser,
        testReleaseKey,
        "admin@elsa.org",
        "Administrator"
      );
    }).rejects.toThrow(ReleaseParticipationPermissionError);
  }
});

it("cannot modify its own participant role in the release", async () => {
  {
    // Throw error when member try to remove/modify manager
    await expect(async () => {
      await releaseParticipationService.addOrInsertParticipant(
        allowedAdministratorUser,
        testReleaseKey,
        allowedAdministratorUser.email,
        "Manager"
      );
    }).rejects.toThrow(ReleaseParticipationPermissionError);
  }
});
