import e from "../../../dbschema/edgeql-js";
import { DependencyContainer } from "tsyringe";
import { getServices } from "../../di-helpers";
import { UserObject } from "./helpers";
import { UserService } from "../../business/services/user-service";

export const TEST_SUBJECT_5 = "http://subject5.com";
export const TEST_SUBJECT_5_EMAIL = "subject5@elsa.net";
export const TEST_SUBJECT_5_DISPLAY = "Test User 5";

/**
 * Will create a user that is allowed to administrator/refresh datasets
 */
export async function insertUser5(
  dc: DependencyContainer
): Promise<UserObject> {
  const { edgeDbClient } = getServices(dc);

  await e
    .insert(e.permission.User, {
      subjectId: TEST_SUBJECT_5,
      displayName: TEST_SUBJECT_5_DISPLAY,
      email: TEST_SUBJECT_5_EMAIL,

      // only dataset work
      isAllowedOverallAdministratorView: false,
      isAllowedCreateRelease: false,
      isAllowedRefreshDatasetIndex: true,

      userAuditEvent: e.insert(e.audit.UserAuditEvent, {
        whoId: TEST_SUBJECT_5,
        whoDisplayName: TEST_SUBJECT_5_DISPLAY,
        occurredDateTime: new Date(),
        actionCategory: "E",
        actionDescription: "Login",
        outcome: 0,
      }),
    })
    .run(edgeDbClient);

  return {
    subject_id: TEST_SUBJECT_5,
    email: TEST_SUBJECT_5_EMAIL,
    name: TEST_SUBJECT_5_DISPLAY,
  };
}
