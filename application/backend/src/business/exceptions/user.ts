import { Base7807Error } from "@umccr/elsa-types/error-types";

export class NotAuthorisedViewUserManagement extends Base7807Error {
  constructor(subjectId?: string) {
    super(
      "Unauthorised attempt to read access user management, or user does not exist",
      403,
      `User do not have a role to read access user management${
        subjectId ? ` for the subject Id of '${subjectId}'` : ""
      }.`
    );
  }
}

export class NotAuthorisedEditUserManagement extends Base7807Error {
  constructor() {
    super(
      "Unauthorised attempt to edit user permission.",
      403,
      `User do not have a role to edit user permission.`
    );
  }
}
