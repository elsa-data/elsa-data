import e from "../../../dbschema/edgeql-js";

/**
 * For the given user return all the associated releases with paging.
 */
export const allReleasesSummaryByUserQuery = e.params(
  { userDbId: e.uuid, limit: e.int32, offset: e.int32 },
  (params) =>
    e.select(e.permission.User, (u) => ({
      releaseParticipant: (rp) => ({
        id: true,
        datasetUris: true,
        releaseIdentifier: true,
        applicationDacTitle: true,
        applicationDacIdentifier: true,
        "@role": true,
        runningJob: {
          percentDone: true,
        },
        // we could possibly think of reverse ordering by some time/last updated - might be more meaningful
        // as release identifier is essentially a meaningless random string
        order_by: {
          expression: rp.releaseIdentifier,
          direction: e.ASC,
        },
        limit: params.limit,
        offset: params.offset,
      }),
      filter: e.op(u.id, "=", params.userDbId),
    }))
);
