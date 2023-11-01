import { Base7807Error } from "@umccr/elsa-types/error-types";

export class ReleaseViewError extends Base7807Error {
  constructor(releaseKey?: string) {
    super(
      "The user does not have permission to view/access the content release",
      403,
      `The user do not have the permission to access release${
        releaseKey ? ` with key '${releaseKey}'` : ""
      }.`,
    );
  }
}

export class ReleaseCreateError extends Base7807Error {
  constructor() {
    super(
      "The user does not have permission to access the content release",
      403,
      `The user do not have the permission to create new releases.`,
    );
  }
}
