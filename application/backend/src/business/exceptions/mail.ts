import { Base7807Error } from "@umccr/elsa-types/error-types";

export class MailTransporterUndefined extends Base7807Error {
  constructor() {
    super(
      "mail transporter undefined",
      500,
      "the mail transporter was used when it is undefined"
    );
  }
}
