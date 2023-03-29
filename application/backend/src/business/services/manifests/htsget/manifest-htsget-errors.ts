import { Base7807Error } from "@umccr/elsa-types/error-types";

export class HtsGetManifestError extends Base7807Error {
  constructor(
    title: string,
    status: number,
    detail?: string,
    instance?: string
  ) {
    super(title, status, detail, instance);
  }

  /**
   * Error representing an unimplemented path.
   */
  public static unimplemented(): HtsGetManifestError {
    return new HtsGetManifestError(
      "unimplemented",
      500,
      "this storage type is not implemented"
    );
  }

  /**
   * Error representing a feature that is not enabled.
   */
  public static not_enabled(): HtsGetManifestError {
    return new HtsGetManifestError(
      "not enabled",
      404,
      "the htsget manifest api endpoint is not enabled"
    );
  }

  /**
   * Error representing an unimplemented path.
   */
  public static manifest_error(): HtsGetManifestError {
    return new HtsGetManifestError(
      "manifest error",
      404,
      "failed to get manifest for htsget endpoint"
    );
  }
}
