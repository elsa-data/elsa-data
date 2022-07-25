import e from "../../../dbschema/edgeql-js";

const rs = e
  .select(e.release.Release, (r) => ({
    filter: e.op(r.id, "=", e.uuid("")),
  }))
  .assert_single().datasetUris;

/**
 * An EdgeDb query for all the dataset details for those datasets
 * associated with a given release.
 */
const allReleaseDatasetsQuery = e.params({ releaseId: e.uuid }, (params) =>
  e.select(e.dataset.Dataset, (ds) => ({
    ...e.dataset.Dataset["*"],
    filter: e.op(
      ds.uri,
      "=",
      e.array_unpack(
        e
          .select(e.release.Release, (r) => ({
            filter: e.op(r.id, "=", params.releaseId),
          }))
          .assert_single().datasetUris
      )
    ),
  }))
);

/**
 * An EdgeDb query that returns all releases (filter so the specified user only sees their releases)
 * and with various summary level data included.
 */
export const allReleasesSummaryByUserQuery = e.params(
  { userDbId: e.uuid },
  (params) =>
    e.select(e.release.Release, (r) => ({
      ...e.release.Release["*"],
      runningJob: {
        percentDone: true,
      },
      userRoles: e.select(
        r["<releaseParticipant[is permission::User]"],
        (u) => ({
          id: true,
          filter: e.op(u.id, "=", params.userDbId),
          // "@role": true
        })
      ),
    }))
);
