import e, { $infer } from "../../dbschema/edgeql-js";
import { UnexpectedStateInternalServerError } from "../api/errors/unexpected-state-internal-server-error";
import { isNil } from "lodash";

const singleUserQuery = e
  .select(e.permission.User, () => ({
    id: true,
    subjectId: true,
    displayName: true,
  }))
  .assert_single();

type SingleUserResult = $infer<typeof singleUserQuery>;

export class AuthenticatedUser {
  constructor(private readonly dbUser: SingleUserResult) {
    if (
      isNil(this.dbUser) ||
      isNil(this.dbUser.id) ||
      isNil(this.dbUser.subjectId) ||
      isNil(this.dbUser.displayName)
    )
      throw new UnexpectedStateInternalServerError(
        "Cannot instantiate an AuthenticatedUser without being passed a user database record"
      );
  }

  /**
   * The internal EdgeDb id for the User record
   */
  public get dbId(): string {
    return this.dbUser!.id;
  }

  /**
   * The OIDC subject identifier for the user in the broader world
   */
  public get subjectId(): string {
    return this.dbUser!.subjectId;
  }

  /**
   * A display name for the user
   */
  public get displayName(): string {
    return this.dbUser!.displayName!;
  }
}
