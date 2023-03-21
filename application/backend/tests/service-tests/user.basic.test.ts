import * as edgedb from "edgedb";
import { AuthenticatedUser } from "../../src/business/authenticated-user";
import { beforeEachCommon } from "./user.common";
import { registerTypes } from "../test-dependency-injection.common";
import { UsersService } from "../../src/business/services/users-service";
import { NotAuthorisedModifyUserManagement } from "../../src/business/exceptions/user";

let existingUser: AuthenticatedUser;
let edgeDbClient: edgedb.Client;
let userService: UsersService;

beforeEach(async () => {
  ({ existingUser, edgeDbClient } = await beforeEachCommon());

  const testContainer = await registerTypes();

  userService = testContainer.resolve(UsersService);
});

it("test for existence of user who does exist", async () => {
  const u = await userService.getBySubjectId("http://subject1.com");

  expect(u).toBeInstanceOf(AuthenticatedUser);

  expect(u!.subjectId).toBe("http://subject1.com");
  // we probably shouldn't assert the format of edgedb ids - but wouldn't mind knowing if they change
  expect(u!.dbId).toMatch(/[a-z0-9-]{36}/);
  expect(u!.displayName).toBe("Test User Who Is An Admin");
});

it("test for existence of user who does not exist", async () => {
  const u = await userService.getBySubjectId("http://i.dont/exist/as.a.user");

  expect(u).toBeNull();
});

it("upsert a new user", async () => {
  const newUser = await userService.upsertUserForLogin(
    "http://newuser.com",
    "New User",
    "test@example.com"
  );

  const u = await userService.getBySubjectId("http://newuser.com");

  expect(u).toBeInstanceOf(AuthenticatedUser);

  expect(u!.subjectId).toBe("http://newuser.com");
  expect(u!.displayName).toBe("New User");
});

it("upsert an existing user to a new display name", async () => {
  const newUser = await userService.upsertUserForLogin(
    "http://subject1.com",
    "New Display Name",
    "test@example.com"
  );

  const u = await userService.getBySubjectId("http://subject1.com");

  expect(u).toBeInstanceOf(AuthenticatedUser);

  expect(u!.subjectId).toBe("http://subject1.com");
  expect(u!.displayName).toBe("New Display Name");
});

it("SuperAdmin change other user permission", async () => {
  const newUser = await userService.upsertUserForLogin(
    "http://test.com",
    "New Display Name",
    "test@example.com"
  );

  await userService.changePermission(existingUser, "test@example.com", {
    isAllowedCreateRelease: true,
    isAllowedOverallAdministratorView: true,
    isAllowedRefreshDatasetIndex: true,
  });

  const u = await userService.getBySubjectId("http://test.com");
  expect(u).toBeInstanceOf(AuthenticatedUser);

  expect(u!.isAllowedCreateRelease).toBe(true);
  expect(u!.isAllowedOverallAdministratorView).toBe(true);
  expect(u!.isAllowedRefreshDatasetIndex).toBe(true);
});

it("normal user change attempt change permission", async () => {
  const newUser = await userService.upsertUserForLogin(
    "http://test.com",
    "New Display Name",
    "test@example.com"
  );
  await expect(async () => {
    await userService.changePermission(newUser, "test@example.com", {
      isAllowedCreateRelease: true,
      isAllowedOverallAdministratorView: true,
      isAllowedRefreshDatasetIndex: true,
    });
  }).rejects.toThrow(NotAuthorisedModifyUserManagement);
});
