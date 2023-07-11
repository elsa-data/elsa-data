import { Base7807Error } from "@umccr/elsa-types";
export const NOT_AUTHORISED_MESSAGE = "Not authorised with current credentials";

export class NotAuthorisedCredentials extends Base7807Error {
  constructor(message?: string) {
    super(NOT_AUTHORISED_MESSAGE, 401, message);
  }
}
