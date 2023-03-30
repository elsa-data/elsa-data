import { Base7807Error } from "@umccr/elsa-types/error-types";

export class ManifestHtsgetStorageNotEnabled extends Base7807Error {
  constructor() {
    super("not enabled", 404, "this storage type is not enabled");
  }
}

export class ManifestHtsgetEndpointNotEnabled extends Base7807Error {
  constructor() {
    super(
      "not enabled",
      404,
      "the htsget manifest api endpoint is not enabled"
    );
  }
}

export class ManifestHtsgetError extends Base7807Error {
  constructor() {
    super("manifest error", 404, "failed to get manifest for htsget endpoint");
  }
}
