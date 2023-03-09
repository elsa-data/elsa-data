import { Base7807Error } from "@umccr/elsa-types/error-types";

export class ReleaseParticipationPermissionError extends Base7807Error {
  constructor(releaseKey: string) {
    super(
      "The user does not have permission to alter the participants of this release",
      400,
      `The release with id '${releaseKey}' cannot have its participants changed by this user`
    );
  }
}
