import e from "../../../dbschema/edgeql-js";

/**
 * For the given user return all the associated releases with paging.
 */
export const allReleasesSummaryByUserQuery = e.params(
  { userDbId: e.uuid, limit: e.int32, offset: e.int32 },
  (params) =>
    e.select(e.permission.User, (_) => ({
      releaseParticipant: (rp) => ({
        id: true,
        datasetUris: true,
        releaseIdentifier: true,
        applicationDacTitle: true,
        applicationDacIdentifier: true,
        "@role": true,
        runningJob: {
          // we are avoiding fetching the message/details etc (which could be large) in this summary
          id: true,
          percentDone: true,
        },
        activation: {
          // we are avoiding fetching the manifest etc (which could be large) in this summary
          id: true,
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
      filter_single: { id: params.userDbId },
    }))
);

/**
 * Set the `lastUpdated` field of a release (specified by a `releaseId`) to the
 * current time.
 */
export const touchRelease = e.params(
  {
    releaseId: e.uuid,
  },
  (params) =>
    e.update(e.release.Release, (r) => ({
      filter: e.op(r.id, "=", params.releaseId),
      set: { lastUpdated: e.datetime_current() },
    }))
);

/**
 * Find the next release identifier based on release count.
 * @param prefix The prefix id before the release count.
 * @returns
 */
export const getNextReleaseId = (prefix: string = "R") => {
  const minDigitLength = 3;

  const nextIdString = e.to_str(e.op(e.count(e.release.Release), "+", 1));

  // Formatting string to add leading 0s if len(nextId) < minDigitLength
  const formatIdString = e.op(
    e.str_pad_start(nextIdString, minDigitLength, "0"),
    "if",
    e.op(e.len(nextIdString), "<=", minDigitLength),
    "else",
    nextIdString
  );

  return e.op(e.str(prefix), "++", formatIdString);
};
