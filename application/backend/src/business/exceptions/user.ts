import { Base7807Error } from "@umccr/elsa-types/error-types";

export class NotAuthorisedGetOwnUser extends Base7807Error {
  constructor(subjectId?: string) {
    super(
      "Unauthorised attempt to use with this credential",
      // Using 401, so user get kicked to the login page
      401,
      `User is unable to read its own user information${
        subjectId ? ` subjectId: '${subjectId}'` : ""
      }.`
    );
  }
}

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

export class NonExistentUser extends Base7807Error {
  constructor(subjectId: string) {
    super(
      "user does not exist",
      500,
      `user with subject id ${subjectId} does not exist`
    );
  }
}

export class UserExist extends Base7807Error {
  constructor(email: string) {
    super(
      "user does exist",
      400,
      `user with email ${email} exist in the system`
    );
  }
}
