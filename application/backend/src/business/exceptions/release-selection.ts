import { Base7807Error } from "@umccr/elsa-types/error-types";

export class ReleaseSelectionPermissionError extends Base7807Error {
  constructor(releaseKey: string) {
    super(
      "The user does not have permission to alter the selection state of nodes (specimens/patients/cases) in this release",
      400,
      `The release with id '${releaseKey}' cannot have its selection state of nodes changed by this user`,
    );
  }
}

export class ReleaseSelectionNonExistentIdentifierError extends Base7807Error {
  constructor(identifiers: string[]) {
    super(
      "Identifier(s) refers to zero specimens",
      400,
      `The following identifier(s) refer no specimens: ${identifiers}`,
    );
  }
}

export class ReleaseSelectionCrossLinkedIdentifierError extends Base7807Error {
  constructor() {
    super("Identifiers are cross-linked", 400);
  }
}
