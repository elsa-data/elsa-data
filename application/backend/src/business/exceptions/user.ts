import { Base7807Error } from "@umccr/elsa-types/error-types";

export class NotAuthorisedViewUserManagement extends Base7807Error {
  constructor(subjectId?: string) {
    super(
      "Unauthorised attempt to access user management, or user does not exist",
      403,
      `User do not have a role to access user management${
        subjectId ? ` for the subject Id of '${subjectId}'` : ""
      }.`
    );
  }
}
