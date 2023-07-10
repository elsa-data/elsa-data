import { AuthenticatedUser } from "../../../src/business/authenticated-user";
import assert from "assert";
import { beforeEachCommon } from "./releases.common";
import { registerTypes } from "../../test-dependency-injection.common";
import { ReleaseService } from "../../../src/business/services/releases/release-service";
import { Client } from "edgedb";
import { ReleaseParticipationService } from "../../../src/business/services/releases/release-participation-service";
import _ from "lodash";
import {
  ReleaseParticipationExistError,
  ReleaseParticipationPermissionError,
} from "../../../src/business/exceptions/release-participation";

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
    testReleaseKey,
    10,
    0
  );

  const data = result.data;
  expect(data).not.toBeNull();
  assert(data != null);

  // our demo release has 4 people involved
  expect(result.total).toBe(4);

  const comparableResults = _.map(data, (item) =>
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

  expect(data[0]).toHaveProperty("lastLogin");
  expect(data[0]).toHaveProperty("id");
});

it("adding a user who doesn't yet exist makes a potential user who is returned with no last login", async () => {
  await releaseParticipationService.addParticipant(
    superAdminUser,
    testReleaseKey,
    "test@example.com",
    "Manager"
  );

  const result = await releaseParticipationService.getParticipants(
    superAdminUser,
    testReleaseKey,
    10,
    0
  );

  const data = result.data;
  expect(data).not.toBeNull();
  assert(data != null);

  // our potential user should come back
  expect(result.total).toBe(5);

  const noLastLoginArray = data.filter((x) => x.lastLogin === null);

  expect(noLastLoginArray).toHaveLength(1);
  expect(noLastLoginArray[0].role).toBe("Manager");
});

it("real users and potential users can both have their roles altered", async () => {
  // add a potential user with Member role
  await releaseParticipationService.addParticipant(
    superAdminUser,
    testReleaseKey,
    "test@example.com",
    "Member"
  );

  {
    const startingResult = await releaseParticipationService.getParticipants(
      superAdminUser,
      testReleaseKey,
      10,
      0
    );

    const data = startingResult.data;
    assert(data != null);
    expect(data.filter((r) => r.role === "Administrator")).toHaveLength(2);
    expect(data.filter((r) => r.role === "Manager")).toHaveLength(1);
    // we should have two Members
    expect(data.filter((r) => r.role === "Member")).toHaveLength(2);
  }

  // upgrade our real user member to Manager
  await releaseParticipationService.editParticipant(
    superAdminUser,
    testReleaseKey,
    "subject4@elsa.net",
    "Manager"
  );

  // upgrade our potential user to a Manager as well
  await releaseParticipationService.editParticipant(
    superAdminUser,
    testReleaseKey,
    "test@example.com",
    "Manager"
  );

  {
    const result = await releaseParticipationService.getParticipants(
      superAdminUser,
      testReleaseKey,
      10,
      0
    );

    const data = result.data;
    expect(data).not.toBeNull();
    assert(data != null);

    expect(data.filter((r) => r.role === "Administrator")).toHaveLength(2);
    // the two Members have been upgraded
    expect(data.filter((r) => r.role === "Manager")).toHaveLength(3);
    expect(data.filter((r) => r.role === "Member")).toHaveLength(0);
  }
});

it("real users and potential users can be removed", async () => {
  // add a potential user with Member role
  const newMemberDbId = await releaseParticipationService.addParticipant(
    allowedAdministratorUser,
    testReleaseKey,
    "test@example.com",
    "Member"
  );

  await releaseParticipationService.removeParticipant(
    allowedAdministratorUser,
    testReleaseKey,
    allowedMemberUser.email
  );
  await releaseParticipationService.removeParticipant(
    allowedAdministratorUser,
    testReleaseKey,
    "test@example.com"
  );

  {
    const result = await releaseParticipationService.getParticipants(
      superAdminUser,
      testReleaseKey,
      10,
      0
    );

    const data = result.data;

    expect(data).not.toBeNull();
    assert(data != null);

    expect(data.filter((r) => r.role === "Administrator")).toHaveLength(2);
    // the two Members have been upgraded
    expect(data.filter((r) => r.role === "Manager")).toHaveLength(1);
    expect(data.filter((r) => r.role === "Member")).toHaveLength(0);
  }
});

it("lower roles cannot remove/modify higher participant role", async () => {
  {
    // Throw error when member try to remove/modify manager
    await expect(async () => {
      await releaseParticipationService.removeParticipant(
        allowedMemberUser,
        testReleaseKey,
        allowedManagerUser.email
      );
    }).rejects.toThrow(ReleaseParticipationPermissionError);
    await expect(async () => {
      await releaseParticipationService.addParticipant(
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
        allowedAdministratorUser.email
      );
    }).rejects.toThrow(ReleaseParticipationPermissionError);
    await expect(async () => {
      await releaseParticipationService.addParticipant(
        allowedManagerUser,
        testReleaseKey,
        "admin@elsa.org",
        "Administrator"
      );
    }).rejects.toThrow(ReleaseParticipationPermissionError);
  }
});

it("cannot edit its own participant role in the release", async () => {
  {
    // Throw error when member try to remove/modify manager
    await expect(async () => {
      await releaseParticipationService.editParticipant(
        allowedAdministratorUser,
        testReleaseKey,
        allowedAdministratorUser.email,
        "Manager"
      );
    }).rejects.toThrow(ReleaseParticipationPermissionError);
  }
});

it("cannot add new participant which has exist in the release", async () => {
  {
    // Throw error when member try to remove/modify manager
    await expect(async () => {
      await releaseParticipationService.addParticipant(
        allowedAdministratorUser,
        testReleaseKey,
        allowedAdministratorUser.email,
        "Manager"
      );
    }).rejects.toThrow(ReleaseParticipationExistError);
  }
});
