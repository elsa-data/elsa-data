import { ReleaseDetailType } from "@umccr/elsa-types";

/**
 * We extend our API level ReleaseType with a map used
 * purely for UI
 */
export type ReleaseTypeLocal = ReleaseDetailType & {
  datasetMap: Map<string, string>;
};
