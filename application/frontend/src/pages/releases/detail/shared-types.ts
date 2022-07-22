import { ReleaseDetailType } from "@umccr/elsa-types";
import { ReactNode } from "react";

/**
 * We extend our API level ReleaseType with a map used
 * purely for UI
 */
export type ReleaseTypeLocal = ReleaseDetailType & {
  datasetMap: Map<string, ReactNode>;
};
