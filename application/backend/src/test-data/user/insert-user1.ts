import e from "../../../dbschema/edgeql-js";
import { DependencyContainer } from "tsyringe";
import { getServices } from "../../di-helpers";
import { UserObject } from "./helpers";

export const TEST_SUBJECT_1 = "http://subject1.com";
export const TEST_SUBJECT_1_EMAIL = "subject1@elsa.net";
export const TEST_SUBJECT_1_DISPLAY = "Test User 1";

/**
 * Will create a superAdmin user
 */
export async function insertUser1(
  dc: DependencyContainer
): Promise<UserObject> {
  const { edgeDbClient } = getServices(dc);

  const userDb = await e
    .insert(e.permission.User, {
      subjectId: TEST_SUBJECT_1,
      displayName: TEST_SUBJECT_1_DISPLAY,
      email: TEST_SUBJECT_1_EMAIL,

      // All true for SuperAdmin
      isAllowedOverallAdministratorView: true,
      isAllowedCreateRelease: true,
      isAllowedRefreshDatasetIndex: true,

      userAuditEvent: e.insert(e.audit.UserAuditEvent, {
        whoId: TEST_SUBJECT_1,
        whoDisplayName: TEST_SUBJECT_1_DISPLAY,
        occurredDateTime: new Date(),
        actionCategory: "E",
        actionDescription: "Login",
        outcome: 0,
        inProgress: false,
      }),
    })
    .run(edgeDbClient);

  return {
    dbId: userDb.id,
    subjectId: TEST_SUBJECT_1,
    email: TEST_SUBJECT_1_EMAIL,
    name: TEST_SUBJECT_1_DISPLAY,
  };
}
