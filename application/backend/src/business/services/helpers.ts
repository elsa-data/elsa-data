import e from "../../../dbschema/edgeql-js";
import { Executor } from "edgedb";
import { AuthenticatedUser } from "../authenticated-user";
import { UserService } from "./user-service";
import { ReleaseDisappearedError } from "../exceptions/release-disappear";

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
 * @param userService
 * @param user
 * @param releaseKey
 * @deprecated use the base boundary method in Release preferably
 */
export async function doRoleInReleaseCheck(
  userService: UserService,
  user: AuthenticatedUser,
  releaseKey?: string
) {
  const userRole = releaseKey
    ? await userService.roleInRelease(user, releaseKey)
    : null;

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
 * @param releaseKey the release to load
 */
export async function getReleaseInfo(
  edgeDbClient: Executor,
  releaseKey: string
) {
  // the base (id only) query that will give us just the release
  const releaseQuery = e
    .select(e.release.Release, (r) => ({
      filter: e.op(r.releaseKey, "=", releaseKey),
    }))
    .assert_single();

  // the set of selected specimens from the release
  const releaseSelectedSpecimensQuery = e.select(
    releaseQuery.selectedSpecimens
  );

  const releaseInfoQuery = e.select(releaseQuery, (r) => ({
    ...e.release.Release["*"],
    applicationCoded: {
      ...e.release.ApplicationCoded["*"],
    },
    runningJob: {
      ...e.job.Job["*"],
    },
    activation: {
      ...e.release.Activation["*"],
    },
    dataSharingConfiguration: {
      ...e.release.DataSharingConfiguration["*"],
    },
    // we are loosely linked (by uri) to datasets which this release draws data from
    // TODO: revisit the loose linking
    datasetIds: e.select(e.dataset.Dataset, (ds) => ({
      id: true,
      uri: true,
      filter: e.op(ds.uri, "in", e.array_unpack(r.datasetUris)),
    })),
  }));

  const releaseInfo = await releaseInfoQuery.run(edgeDbClient);

  if (!releaseInfo) throw new ReleaseDisappearedError(releaseKey);

  const datasetUriToIdMap = new Map(
    releaseInfo.datasetIds.map((d) => [d.uri, e.uuid(d.id)])
  );

  const datasetIdToUriMap = new Map(
    releaseInfo.datasetIds.map((d) => [d.id, d.uri])
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
    })
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

/**
 * A temporary to pick external identifiers based on the first value stored in the array.
 * This function will sort (based on the "system" properties) and take the first value from the externalIdentifier array
 * @param externalIdentifiers
 * @returns
 */
export function getFirstSystemSortedExternalIdentifierValue(
  externalIdentifiers?: { system: string; value: string }[]
): string {
  if (!externalIdentifiers || externalIdentifiers.length == 0) return "";

  externalIdentifiers.sort((a, b) =>
    a.system.toLowerCase() > b.system.toLowerCase() ? 1 : -1
  );
  return externalIdentifiers[0].value;
}
