import { Base7807Error } from "@umccr/elsa-types/error-types";

export class ReleaseSelectionPermissionError extends Base7807Error {
  constructor(releaseKey: string) {
    super(
      "The user does not have permission to alter the selection state of nodes (specimens/patients/cases) in this release",
      400,
      `The release with id '${releaseKey}' cannot have its selection state of nodes changed by this user`
    );
  }
}

export class ReleaseSelectionDatasetMismatchError extends Base7807Error {
  constructor(releaseKey: string, specimenIds: string[]) {
    super(
      "The specimens that were requested for selection are not specimens that are from a dataset included in this release",
      400,
      `The release with id '${releaseKey}' does not contain the specimens with ids '${specimenIds}' in its datasets`
    );
  }
}
