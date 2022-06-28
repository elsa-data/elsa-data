import { ReleaseType } from "@umccr/elsa-types";

/**
 * We extend our API level ReleaseType with a map used
 * purely for UI
 */
export type ReleaseTypeLocal = ReleaseType & {
  datasetMap: Map<string, string>;
};
