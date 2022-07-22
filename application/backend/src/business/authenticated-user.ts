import e, { $infer } from "../../dbschema/edgeql-js";
import { UnexpectedStateInternalServerError } from "../api/errors/unexpected-state-internal-server-error";
import { isNil } from "lodash";

const singleUserQuery = e
  .select(e.permission.User, () => ({ id: true, subjectId: true }))
  .assert_single();

type SingleUserResult = $infer<typeof singleUserQuery>;

export class AuthenticatedUser {
  constructor(private readonly dbUser: SingleUserResult) {
    if (isNil(this.dbUser))
      throw new UnexpectedStateInternalServerError(
        "Cannot instantiate an AuthenticatedUser without being passed a user database record"
      );
  }

  public get dbId(): string {
    return this.dbUser!.id;
  }

  public get subjectId(): string {
    return this.dbUser!.subjectId;
  }
}
