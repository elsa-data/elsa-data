import { createClient } from "edgedb";
import { blankTestData } from "../../src/test-data/blank-test-data";
import { insert10G } from "../../src/test-data/insert-test-data-10g";
import e from "../../dbschema/edgeql-js";
import { AuthenticatedUser } from "../../src/business/authenticated-user";
import { insert10F } from "../../src/test-data/insert-test-data-10f";
import { DependencyContainer } from "tsyringe";

/**
 * This is a common beforeEach call that should be used to setup a base
 * test state for all dataset testing.
 *
 * It returns a parcel of db ids that can be used for further setup in tests.
 *
 * If you make *any* changes here - you must re-run all the release tests
 * to ensure that the state change hasn't unexpectedly resulted in a test failing.
 */
export async function beforeEachCommon(dc: DependencyContainer) {
  const edgeDbClient = createClient({});

  await blankTestData();
  const teng = await insert10G(dc);
  const tenf = await insert10F(dc);

  // TODO: we don't have an admin model for datasets yet so this is very simple
  const allowedPiSubject = "http://subject1.com";
  const allowedPiEmail = "admin-user@elsa.net";

  const allowedManagerUserInsert = await e
    .insert(e.permission.User, {
      subjectId: allowedPiSubject,
      displayName: "Test User Who Is An Admin",
      email: allowedPiEmail,
    })
    .run(edgeDbClient);

  const adminUser = new AuthenticatedUser({
    id: allowedManagerUserInsert.id,
    subjectId: allowedPiSubject,
    displayName: "Allowed Manager",
    email: allowedPiEmail,
    isAllowedRefreshDatasetIndex: true,
    isAllowedCreateRelease: true,
    isAllowedOverallAdministratorView: true,
    isAllowedChangeUserPermission: true,
    lastLoginDateTime: new Date(),
  });

  const notAllowedUser = new AuthenticatedUser({
    id: allowedManagerUserInsert.id,
    subjectId: "http://subject-not-allowed.com",
    displayName: "not-allowed Member",
    email: "not-allow@emai.com",
    isAllowedRefreshDatasetIndex: false,
    isAllowedCreateRelease: false,
    isAllowedOverallAdministratorView: false,
    isAllowedChangeUserPermission: false,
    lastLoginDateTime: new Date(),
  });

  return {
    edgeDbClient,
    tenfDatasetId: tenf.id,
    tengDatasetId2: teng.id,
    adminUser,
    notAllowedUser,
  };
}
