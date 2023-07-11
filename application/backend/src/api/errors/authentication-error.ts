import { Base7807Error } from "@umccr/elsa-types";

export class NotAuthorisedCredentials extends Base7807Error {
  constructor(message?: string) {
    super("Not authorised with current credentials", 401, message);
  }
}
