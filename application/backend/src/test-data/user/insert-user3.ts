import e from "../../../dbschema/edgeql-js";
import { DependencyContainer } from "tsyringe";
import { getServices } from "../../di-helpers";
import { UserObject } from "./helpers";

export const TEST_SUBJECT_3 = "http://subject3.com";
export const TEST_SUBJECT_3_EMAIL = "subject3@elsa.net";
export const TEST_SUBJECT_3_DISPLAY = "Test User 3";

/**
 * Will create an ordinary (member/manager) user
 */
export async function insertUser3(
  dc: DependencyContainer
): Promise<UserObject> {
  const { edgeDbClient } = getServices(dc);

  await e
    .insert(e.permission.User, {
      subjectId: TEST_SUBJECT_3,
      displayName: TEST_SUBJECT_3_DISPLAY,
      email: TEST_SUBJECT_3_EMAIL,

      // Declare all false for ordinary user
      isAllowedOverallAdministratorView: false,
      isAllowedCreateRelease: false,
      isAllowedRefreshDatasetIndex: false,

      userAuditEvent: e.insert(e.audit.UserAuditEvent, {
        whoId: TEST_SUBJECT_3,
        whoDisplayName: TEST_SUBJECT_3_DISPLAY,
        occurredDateTime: new Date(),
        actionCategory: "E",
        actionDescription: "Login",
        outcome: 0,
        inProgress: false,
      }),
    })
    .run(edgeDbClient);

  return {
    subject_id: TEST_SUBJECT_3,
    email: TEST_SUBJECT_3_EMAIL,
    name: TEST_SUBJECT_3_DISPLAY,
  };
}
