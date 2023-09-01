import * as edgedb from "edgedb";
import { AuthenticatedUser } from "../../src/business/authenticated-user";
import { beforeEachCommon } from "./commons/user.common";
import { registerTypes } from "../test-dependency-injection.common";
import { UserService } from "../../src/business/services/user-service";
import { NotAuthorisedEditUserManagement } from "../../src/business/exceptions/user";
import { getServices } from "../../src/di-helpers";
import { ElsaSettings } from "../../src/config/elsa-settings";
import { UserData } from "../../src/business/data/user-data";

let existingUser: AuthenticatedUser;
let edgeDbClient: edgedb.Client;
let userService: UserService;
let userData: UserData;

const testContainer = registerTypes();

beforeEach(async () => {
  ({ existingUser, edgeDbClient } = await beforeEachCommon());

  userService = testContainer.resolve(UserService);
  userData = testContainer.resolve(UserData);
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
  const newContainer = testContainer.createChildContainer();

  // because "superadmin" is a permission derived solely from the config - we need to
  // alter the settings to make this true just for this test
  {
    const { settings } = getServices(newContainer);

    // fix the settings
    settings.superAdmins.push({
      sub: existingUser.subjectId,
    });

    // and set back into the DI container
    newContainer.register<ElsaSettings>("Settings", {
      useValue: settings,
    });
  }

  const newUserService = newContainer.resolve(UserService);

  const newUser = await newUserService.upsertUserForLogin(
    "http://test.com",
    "New Display Name",
    "test@example.com"
  );

  await newUserService.changeActiveUserPermission(
    existingUser,
    "http://test.com",
    {
      isAllowedCreateRelease: true,
      isAllowedOverallAdministratorView: true,
      isAllowedRefreshDatasetIndex: true,
    }
  );

  const u = await userData.getDbUserBySubjectId(
    edgeDbClient,
    "http://test.com"
  );

  expect(u.isAllowedCreateRelease).toBe(true);
  expect(u.isAllowedOverallAdministratorView).toBe(true);
  expect(u.isAllowedRefreshDatasetIndex).toBe(true);
});

it("normal user change attempt change permission", async () => {
  const newUser = await userService.upsertUserForLogin(
    "http://test.com",
    "New Display Name",
    "test@example.com"
  );
  const newAuthedUser = new AuthenticatedUser(newUser);
  await expect(async () => {
    await userService.changeActiveUserPermission(
      newAuthedUser,
      "http://test.com",
      {
        isAllowedCreateRelease: true,
        isAllowedOverallAdministratorView: true,
        isAllowedRefreshDatasetIndex: true,
      }
    );
  }).rejects.toThrow(NotAuthorisedEditUserManagement);
});

it("altercation of potential user list", async () => {
  const newContainer = testContainer.createChildContainer();

  // because "superadmin" is a permission derived solely from the config - we need to
  // alter the settings to make this true just for this test
  {
    const { settings } = getServices(newContainer);

    // fix the settings
    settings.superAdmins.push({
      sub: existingUser.subjectId,
    });

    // and set back into the DI container
    newContainer.register<ElsaSettings>("Settings", {
      useValue: settings,
    });
  }
  const newUserService = newContainer.resolve(UserService);

  // Try adding a new potential user to the list
  await newUserService.addPotentialUser(existingUser, "guest@elsa.net", {
    isAllowedCreateRelease: true,
    isAllowedOverallAdministratorView: true,
    isAllowedRefreshDatasetIndex: true,
  });

  let puList = await newUserService.getPotentialUsers(existingUser, 10, 0);
  let newPU = puList.data?.find((v) => v.email == "guest@elsa.net");

  // Check if the potential user is in the list
  expect(!!newPU).toBe(true);

  // Check if changing potential user is working
  await newUserService.changePotentialUserPermission(
    existingUser,
    "guest@elsa.net",
    {
      isAllowedCreateRelease: false,
      isAllowedOverallAdministratorView: false,
      isAllowedRefreshDatasetIndex: false,
    }
  );

  puList = await newUserService.getPotentialUsers(existingUser, 10, 0);
  newPU = puList.data?.find((v) => v.email == "guest@elsa.net");

  expect(newPU?.isAllowedCreateRelease).toBe(false);
  expect(newPU?.isAllowedOverallAdministratorView).toBe(false);
  expect(newPU?.isAllowedRefreshDatasetIndex).toBe(false);

  // Check for removal is working
  await newUserService.removePotentialUser(existingUser, "guest@elsa.net");
  puList = await newUserService.getPotentialUsers(existingUser, 10, 0);
  newPU = puList.data?.find((v) => v.email == "guest@elsa.net");

  expect(!!newPU).toBe(false);
});
