import { Base7807Error } from "../../api/errors/_error.types";

export class BadLimitOffset extends Base7807Error {
  constructor(limit: any, offset: any) {
    super(
      "A limit or offset passed to a paging method was invalid",
      400,
      `Either the limit '${limit}' or offset '${offset} were invalid`
    );
  }
}
