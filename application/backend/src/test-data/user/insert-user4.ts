import e from "../../../dbschema/edgeql-js";
import { DependencyContainer } from "tsyringe";
import { getServices } from "../../di-helpers";
import { UserObject } from "./helpers";

export const TEST_SUBJECT_4 = "http://subject4.com";
export const TEST_SUBJECT_4_EMAIL = "subject4@elsa.net";
export const TEST_SUBJECT_4_DISPLAY = "Test User 4";

/**
 * Will create an ordinary (member/manager) user
 */
export async function insertUser4(
  dc: DependencyContainer
): Promise<UserObject> {
  const { edgeDbClient } = getServices(dc);

  await e
    .insert(e.permission.User, {
      subjectId: TEST_SUBJECT_4,
      displayName: TEST_SUBJECT_4_DISPLAY,
      email: TEST_SUBJECT_4_EMAIL,

      // Declare all false for ordinary user
      isAllowedOverallAdministratorView: false,
      isAllowedCreateRelease: false,
      isAllowedRefreshDatasetIndex: false,

      userAuditEvent: e.insert(e.audit.UserAuditEvent, {
        whoId: TEST_SUBJECT_4,
        whoDisplayName: TEST_SUBJECT_4_DISPLAY,
        occurredDateTime: new Date(),
        actionCategory: "E",
        actionDescription: "Login",
        outcome: 0,
      }),
    })
    .run(edgeDbClient);

  return {
    subject_id: TEST_SUBJECT_4,
    email: TEST_SUBJECT_4_EMAIL,
    name: TEST_SUBJECT_4_DISPLAY,
  };
}
