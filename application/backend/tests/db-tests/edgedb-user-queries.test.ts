import { AuthenticatedUser } from "../../src/business/authenticated-user";
import * as edgedb from "edgedb";
import { beforeEachCommon } from "../service-tests/commons/user.common";
import { userUpdatePermissions } from "../../dbschema/queries";
import e from "../../dbschema/edgeql-js";

let existingUser: AuthenticatedUser;
let edgeDbClient: edgedb.Client;

beforeEach(async () => {
  ({ existingUser, edgeDbClient } = await beforeEachCommon());
});

it("test the change permission query", async () => {
  await userUpdatePermissions(edgeDbClient, {
    userDbId: existingUser.dbId,
    isAllowedCreateRelease: false,
    isAllowedOverallAdministratorView: false,
    isAllowedRefreshDatasetIndex: false,
  });

  const user = await e
    .select(e.permission.User, (_) => ({
      id: true,
      isAllowedRefreshDatasetIndex: true,
      isAllowedOverallAdministratorView: true,
      isAllowedCreateRelease: true,
      filter_single: { id: e.uuid(existingUser.dbId) },
    }))
    .run(edgeDbClient);

  expect(user).toBeDefined();
  expect(user!.isAllowedCreateRelease).toBe(false);
  expect(user!.isAllowedOverallAdministratorView).toBe(false);
  expect(user!.isAllowedRefreshDatasetIndex).toBe(false);
});
