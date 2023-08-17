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

export class ReleaseSelectionNonExistentIdentifierError extends Base7807Error {
  constructor(identifiers: string[]) {
    super(
      "Identifier refers to zero specimens",
      400,
      `The following identifier(s) refer no specimens: ${identifiers}`
    );
  }
}

export class ReleaseSelectionAmbiguousIdentifierError extends Base7807Error {
  constructor(identifiers: string[]) {
    super(
      "Identifier refers to multiple specimens",
      400,
      `The following identifier(s) refer to more than one specimen: ${identifiers}`
    );
  }
}

export class ReleaseSelectionCrossLinkedIdentifierError extends Base7807Error {
  constructor(releaseKey: string, identifiers: string[]) {
    super(
      "The specimens that were requested for selection are not specimens that are from a dataset included in this release",
      400,
      `The release with id '${releaseKey}' does not contain the specimens with ids '${identifiers}' in its datasets`
    );
  }
}
