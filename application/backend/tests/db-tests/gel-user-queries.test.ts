import { AuthenticatedUser } from "../../src/business/authenticated-user";
import * as gel from "gel";
import { beforeEachCommon } from "../service-tests/commons/user.common";
import { userUpdatePermissions } from "../../dbschema/queries";
import e from "../../dbschema/edgeql-js";

let existingUser: AuthenticatedUser;
let gelClient: gel.Client;

beforeEach(async () => {
  ({ existingUser, edgeDbClient: gelClient } = await beforeEachCommon());
});

it("test the change permission query", async () => {
  await userUpdatePermissions(gelClient, {
    subjectId: existingUser.subjectId,
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
    .run(gelClient);

  expect(user).toBeDefined();
  expect(user!.isAllowedCreateRelease).toBe(false);
  expect(user!.isAllowedOverallAdministratorView).toBe(false);
  expect(user!.isAllowedRefreshDatasetIndex).toBe(false);
});
