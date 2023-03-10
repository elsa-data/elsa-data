import { Base7807Error } from "@umccr/elsa-types/error-types";

/**
 * This is a very unlikely event - but one that we are forced to check each time
 * for TypeScript flow purposes. So this would only theoretically as some sort of
 * race condition between us testing for a release being valid at the boundary to
 * a service function, and then later it disappearing from queries. But given we
 * don't really actually delete Releases, I think this will never happen outside dev.
 */
export class ReleaseDisappearedError extends Base7807Error {
  constructor(releaseKey: string) {
    super(
      "A release that passed a previous existence check seems to have disappeared from the database",
      500,
      `The release with key '${releaseKey}' was previously present but now is missing`
    );
  }
}
