import e from "../../../dbschema/edgeql-js";
import { Client } from "edgedb";
import { AuthenticatedUser } from "../authenticated-user";
import { usersService } from "./users";

/**
 * A set of code snippets used within the releases service - but broken out into separate
 * functions that can be independently tested.
 */

export function collapseExternalIds(externals: any): string {
  if (!externals || externals.length < 1) return "<empty ids>";
  else return externals[0].value ?? "<empty id value>";
}

/**
 * Do a boundary level check for entry point into most public service functions - that
 * checks if the user has a role in the given release (and therefore also if the release
 * exists).
 *
 * @param user
 * @param releaseId
 */
export async function doRoleInReleaseCheck(
  user: AuthenticatedUser,
  releaseId: string
) {
  const userRole = await usersService.roleInRelease(user, releaseId);

  if (!userRole)
    throw new Error(
      "Unauthenticated attempt to access release, or release does not exist"
    );

  return {
    userRole: userRole,
  };
}

/**
 * Do a 'lite' fetch of the information about the given release and return it in a format
 * that is useful and friendly for the caller (i.e. ids -> JS Set())
 *
 * @param edgeDbClient an edgedb client
 * @param releaseId the release to load
 */
export async function getReleaseInfo(edgeDbClient: Client, releaseId: string) {
  const releaseInfoQuery = e
    .select(e.release.Release, (r) => ({
      // the select specimens tell us the leaf nodes that have been 'checked'
      selectedSpecimens: true,
      // the manual exclusions are nodes that we have explicitly said that they and their children should never be shared
      manualExclusions: true,
      // we are loosely linked (by uri) to datasets which this release draws data from
      // TODO: revisit the loose linking
      datasetIds: e.select(e.dataset.Dataset, (ds) => ({
        id: true,
        uri: true,
        filter: e.op(ds.uri, "in", e.array_unpack(r.datasetUris)),
      })),
      filter: e.op(r.id, "=", e.uuid(releaseId)),
    }))
    .assert_single();

  const releaseInfo = await releaseInfoQuery.run(edgeDbClient);

  if (!releaseInfo)
    throw new Error(
      `Case fetch attempted on non-existent release ${releaseId}`
    );

  const selectedSpecimenIds: Set<string> = new Set<string>(
    releaseInfo.selectedSpecimens.map((ss) => ss.id)
  );

  const selectedSpecimenUuids = new Set(
    releaseInfo.selectedSpecimens.map((ss) => e.uuid(ss.id))
  );

  const releaseExcluded: Set<string> = new Set<string>(
    releaseInfo.manualExclusions.map((ss) => ss.id)
  );

  const datasetUriToIdMap = new Map(
    releaseInfo.datasetIds.map((d) => [d.uri, e.uuid(d.id)])
  );

  const datasetIdToUriMap = new Map(
    releaseInfo.datasetIds.map((d) => [d.id, d.uri])
  );

  return {
    releaseInfoQuery,
    // we provide all the specimens ids that are currently selected as a Set<string>
    selectedSpecimenIds,
    // and as a set of uuid expressions
    selectedSpecimenUuids,
    releaseExcluded,
    datasetUriToIdMap,
  };
}
