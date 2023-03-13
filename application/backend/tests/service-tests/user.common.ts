import { createClient } from "edgedb";
import { blankTestData } from "../../src/test-data/blank-test-data";
import e from "../../dbschema/edgeql-js";
import { AuthenticatedUser } from "../../src/business/authenticated-user";

/**
 * This is a common beforeEach call that should be used to setup a base
 * test state for all user testing.
 *
 * If you make *any* changes here - you must re-run all the release tests
 * to ensure that the state change hasn't unexpectedly resulted in a test failing.
 */
export async function beforeEachCommon() {
  const edgeDbClient = createClient({});

  await blankTestData();

  const allowedPiSubject = "http://subject1.com";
  const allowedPiDisplayName = "Test User Who Is An Admin";
  const allowedPiEmail = "subject1@elsa.net";

  const allowedPiUserInsert = await e
    .insert(e.permission.User, {
      subjectId: allowedPiSubject,
      displayName: allowedPiDisplayName,
      email: allowedPiEmail,
    })
    .run(edgeDbClient);

  const existingUser = new AuthenticatedUser({
    id: allowedPiUserInsert.id,
    subjectId: allowedPiSubject,
    displayName: allowedPiDisplayName,
    email: allowedPiEmail,
    isAllowedImportDataset: true,
    isAllowedChangeReleaseDataOwner: true,
    isAllowedCreateRelease: true,
    isAllowedViewAllAuditEvents: true,
    isAllowedSyncDataAccessEvents: true,
    isAllowedViewDatasetContent: true,
    isAllowedViewUserManagement: true,
    lastLoginDateTime: new Date(),
  });

  return {
    edgeDbClient,
    existingUser,
  };
}
