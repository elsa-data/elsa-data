import { Base7807Error } from "@umccr/elsa-types/error-types";

export class ReleaseHtsgetNotConfigured extends Base7807Error {
  constructor() {
    super(
      "The htsget service has not been configured",
      500,
      `Cannot enable or disable htsget because it has not been enabled in config`,
    );
  }
}
