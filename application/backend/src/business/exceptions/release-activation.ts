import { Base7807Error } from "@umccr/elsa-types/error-types";
import { TRPCError } from "@trpc/server";

export class ReleaseActivationPermissionError extends Base7807Error {
  constructor(releaseKey: string) {
    super(
      "The user does not have permission to alter the activation state of this release",
      400,
      `The release with id '${releaseKey}' cannot have its activation state changed by this user`,
    );
  }
}

export class ReleaseNoEditingWhilstActivatedError extends Base7807Error {
  constructor(releaseKey: string) {
    super(
      "An attempt was made to edit fields in a release whilst it is activated",
      400,
      `The release with id '${releaseKey}' is activated and hence cannot be edited`,
    );
  }
}

export class ReleaseActivationStateError extends Base7807Error {
  constructor(releaseKey: string) {
    super(
      "An attempt was made to activate a release that was already activated",
      400,
      `The release with id '${releaseKey}' is activated and hence cannot be activated again`,
    );
  }
}

export class ReleaseDeactivationStateError extends Base7807Error {
  constructor(releaseKey: string) {
    super(
      "An attempt was made to deactivate a release that was not activated",
      400,
      `The release with id '${releaseKey}' is deactivate and hence cannot be deactivated again`,
    );
  }
}

export class ReleaseDeactivationRunningJobError extends Base7807Error {
  constructor(releaseKey: string) {
    super(
      "An attempt was made to deactivate a release while there is an existing running job",
      400,
      `The release with id '${releaseKey}' has an existing running job`,
    );
  }
}

export class ReleaseActivatedNothingError extends Base7807Error {
  constructor(detail: string) {
    super(
      "Cannot activate this release because as currently configured no data would actually be contained in the release",
      undefined,
      detail,
    );
  }
}

export class ReleaseActivatedMismatchedExpectationsError extends Base7807Error {
  constructor(detail: string) {
    super(
      "Cannot activate this release because as currently configured a data type (e.g. reads) is being requested that would not actually be contained in the release",
      undefined,
      detail,
    );
  }
}
