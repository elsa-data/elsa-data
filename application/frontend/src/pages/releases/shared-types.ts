import { ReleaseDetailType } from "../../../../backend/src/shared/schemas-releases";
import { ReactNode } from "react";

/**
 * We extend our API level ReleaseType with a map used
 * purely for UI
 */
export type ReleaseTypeLocal = ReleaseDetailType & {
  datasetMap: Map<string, ReactNode>;
};
