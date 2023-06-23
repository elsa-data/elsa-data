import e from "../../../dbschema/edgeql-js";
import { DependencyContainer } from "tsyringe";
import { getServices } from "../../di-helpers";
import { UserObject } from "./helpers";
import { UserService } from "../../business/services/user-service";

export const TEST_SUBJECT_2 = "http://subject2.com";
export const TEST_SUBJECT_2_EMAIL = "subject2@elsa.net";
export const TEST_SUBJECT_2_DISPLAY = "Test User 2";

/**
 * Will create a user that is allowed to create release
 */
export async function insertUser2(
  dc: DependencyContainer
): Promise<UserObject> {
  const { edgeDbClient } = getServices(dc);

  await e
    .insert(e.permission.User, {
      subjectId: TEST_SUBJECT_2,
      displayName: TEST_SUBJECT_2_DISPLAY,
      email: TEST_SUBJECT_2_EMAIL,

      // Declare allow only for creating release
      isAllowedOverallAdministratorView: false,
      isAllowedCreateRelease: true,
      isAllowedRefreshDatasetIndex: false,

      userAuditEvent: e.insert(e.audit.UserAuditEvent, {
        whoId: TEST_SUBJECT_2,
        whoDisplayName: TEST_SUBJECT_2_DISPLAY,
        occurredDateTime: new Date(),
        actionCategory: "E",
        actionDescription: "Login",
        outcome: 0,
      }),
    })
    .run(edgeDbClient);

  return {
    subject_id: TEST_SUBJECT_2,
    email: TEST_SUBJECT_2_EMAIL,
    name: TEST_SUBJECT_2_DISPLAY,
  };
}
