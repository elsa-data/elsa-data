import e from "../../../dbschema/edgeql-js";
import { Client } from "edgedb";
import { AuthenticatedUser } from "../authenticated-user";
import { UsersService } from "./users-service";

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
 * @param usersService
 * @param user
 * @param releaseId
 */
export async function doRoleInReleaseCheck(
  usersService: UsersService,
  user: AuthenticatedUser,
  releaseId: string,
) {
  const userRole = await usersService.roleInRelease(user, releaseId);

  if (!userRole)
    throw new Error(
      "Unauthenticated attempt to access release, or release does not exist",
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
  // the base (id only) query that will give us just the release
  const releaseQuery = e
    .select(e.release.Release, (r) => ({
      filter: e.op(r.id, "=", e.uuid(releaseId)),
    }))
    .assert_single();

  // the set of selected specimens from the release
  const releaseSelectedSpecimensQuery = e.select(
    releaseQuery.selectedSpecimens,
  );

  const releaseInfoQuery = e.select(releaseQuery, (r) => ({
    ...e.release.Release["*"],
    applicationCoded: {
      ...e.release.ApplicationCoded["*"],
    },
    runningJob: {
      ...e.job.Job["*"],
    },
    // the master computation of whether we are currently enabled for access
    accessEnabled: e.op(
      e.op(e.datetime_current(), ">=", r.releaseStarted),
      "and",
      e.op(e.datetime_current(), "<=", r.releaseEnded),
    ),
    // the manual exclusions are nodes that we have explicitly said that they and their children should never be shared
    //manualExclusions: true,
    // we are loosely linked (by uri) to datasets which this release draws data from
    // TODO: revisit the loose linking
    datasetIds: e.select(e.dataset.Dataset, (ds) => ({
      id: true,
      uri: true,
      filter: e.op(ds.uri, "in", e.array_unpack(r.datasetUris)),
    })),
  }));

  const releaseInfo = await releaseInfoQuery.run(edgeDbClient);

  if (!releaseInfo)
    throw new Error(
      `Case fetch attempted on non-existent release ${releaseId}`,
    );

  const datasetUriToIdMap = new Map(
    releaseInfo.datasetIds.map((d) => [d.uri, e.uuid(d.id)]),
  );

  const datasetIdToUriMap = new Map(
    releaseInfo.datasetIds.map((d) => [d.id, d.uri]),
  );

  const releaseAllDatasetIdDbSet =
    datasetUriToIdMap.size > 0
      ? e.set(...datasetUriToIdMap.values())
      : e.cast(e.uuid, e.set());

  // the (id only) set of all datasets included in this release
  const releaseAllDatasetQuery = e.select(e.dataset.Dataset, (ds) => ({
    ...e.dataset.Dataset["*"],
    filter: e.op(ds.id, "in", releaseAllDatasetIdDbSet),
  }));

  // the (id only) set of all cases from the release datasets irrespective of selection
  const releaseAllDatasetCasesQuery = e.select(releaseAllDatasetQuery.cases);

  // the (id only) set of all cases from the release datasets that are selected
  const releaseSelectedCasesQuery = e.select(
    releaseAllDatasetQuery.cases,
    (dsc) => ({
      externalIdentifiers: true,
      filter: e.op(dsc.patients.specimens, "in", releaseSelectedSpecimensQuery),
    }),
  );

  return {
    releaseQuery,
    releaseSelectedSpecimensQuery,
    releaseInfo,
    releaseInfoQuery,
    datasetIdToUriMap,
    datasetUriToIdMap,
    releaseAllDatasetIdDbSet,
    releaseAllDatasetQuery,
    releaseAllDatasetCasesQuery,
    releaseSelectedCasesQuery,
  };
}
