import { ReleaseType } from "@umccr/elsa-types";

export type ReleaseTypeLocal = ReleaseType & {
  datasetMap: Map<string, string>;
};
