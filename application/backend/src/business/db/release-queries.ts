import e from "../../../dbschema/edgeql-js";

/**
 * Set the `lastUpdated` field of a release (specified by a `releaseId`) to the
 * current time.
 */
export const touchRelease = e.params(
  {
    releaseIdentifier: e.str,
  },
  (params) =>
    e.update(e.release.Release, (r) => ({
      filter: e.op(r.releaseIdentifier, "=", params.releaseIdentifier),
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
