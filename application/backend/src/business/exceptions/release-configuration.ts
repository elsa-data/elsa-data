import { Base7807Error } from "../../shared/error-types";

export class ReleaseConfigurationError extends Base7807Error {
  constructor(errorString?: string) {
    super("The configuration given is not valid", 400, errorString);
  }
}
