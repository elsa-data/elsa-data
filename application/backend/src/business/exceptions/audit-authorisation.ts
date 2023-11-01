import { Base7807Error } from "@umccr/elsa-types/error-types";

export class NotAuthorisedViewAudits extends Base7807Error {
  constructor(releaseKey?: string) {
    super(
      "Unauthorised attempt to access audit events, or audit events does not exist",
      403,
      `User do not have a role to access audit events${
        releaseKey ? ` for the release key of '${releaseKey}'` : ""
      }.`,
    );
  }
}

export class NotAuthorisedUpdateDataEgressRecords extends Base7807Error {
  constructor() {
    super(
      "Unauthorised attempt to update data egress records",
      403,
      `User do not have the permission to update data egress records.`,
    );
  }
}
