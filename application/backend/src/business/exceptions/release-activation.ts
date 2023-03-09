import { Base7807Error } from "@umccr/elsa-types/error-types";

export class ReleaseActivationPermissionError extends Base7807Error {
  constructor(releaseKey: string) {
    super(
      "The user does not have permission to alter the activation state of this release",
      400,
      `The release with id '${releaseKey}' cannot have its activation state changed by this user`
    );
  }
}

export class ReleaseActivationNoEditingAllowedError extends Base7807Error {
  constructor(releaseKey: string) {
    super(
      "An attempt was made to edit a release whilst it is activated",
      400,
      `The release with id '${releaseKey}' is activated and hence cannot be edited`
    );
  }
}

export class ReleaseActivationStateError extends Base7807Error {
  constructor(releaseKey: string) {
    super(
      "An attempt was made to activate a release that was already activated",
      400,
      `The release with id '${releaseKey}' is activated and hence cannot be activated again`
    );
  }
}

export class ReleaseDeactivationStateError extends Base7807Error {
  constructor(releaseKey: string) {
    super(
      "An attempt was made to deactivate a release that was not activated",
      400,
      `The release with id '${releaseKey}' is deactivate and hence cannot be deactivated again`
    );
  }
}
