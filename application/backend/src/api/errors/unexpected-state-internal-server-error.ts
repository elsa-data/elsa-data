import { Base7807Error } from "@umccr/elsa-types/error-types";

/**
 * This error is the error we should throw whenever we have done a check/guard
 * against a condition *that we don't believe should ever occur*. If we think it is possible
 * for the condition to occur, then we should have a real error.
 */
export class UnexpectedStateInternalServerError extends Base7807Error {
  constructor(private detailMessage: string) {
    super("Unexpected State Internal Server Error", 500, detailMessage);
  }
}
