import { Base7807Error } from "../../shared/error-types";

export class ReleaseParticipationPermissionError extends Base7807Error {
  constructor(releaseKey: string) {
    super(
      "The user does not have permission to alter the participants of this release",
      400,
      `The release with id '${releaseKey}' cannot have its participants changed by this user`,
    );
  }
}

export class ReleaseParticipationNotFoundError extends Base7807Error {
  constructor(releaseKey: string, email: string) {
    super(
      "The participant email is not found in this release",
      400,
      `The release with id '${releaseKey}' do not have participant email '${email}'`,
    );
  }
}

export class ReleaseParticipationExistError extends Base7807Error {
  constructor(releaseKey: string, email: string) {
    super(
      "The participant email exist in the current release",
      400,
      `The release with id '${releaseKey}' already has an existing participant email '${email}'`,
    );
  }
}

export class InvalidReleaseKeyError extends Base7807Error {
  constructor(releaseKey: string) {
    super(
      "The release key is not a valid UUID",
      400,
      `The provided release key '${releaseKey}' is not a valid UUID format`,
    );
  }
}
