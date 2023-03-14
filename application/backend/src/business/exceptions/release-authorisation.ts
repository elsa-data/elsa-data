import { Base7807Error } from "@umccr/elsa-types/error-types";

export class ReleaseAccessError extends Base7807Error {
  constructor(releaseKey: string) {
    super(
      "The user does not have permission to access the content release",
      403,
      `The user do not have the permission to access release with key '${releaseKey}'`
    );
  }
}
