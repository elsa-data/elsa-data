import { UnexpectedStateInternalServerError } from "../api/errors/unexpected-state-internal-server-error";
import { isNil } from "lodash";
import { UserDataDbUser } from "./data/user-data";

export type AuthenticatedUserJsonType = Omit<
  NonNullable<UserDataDbUser>,
  | "isAllowedCreateRelease"
  | "isAllowedOverallAdministratorView"
  | "isAllowedRefreshDatasetIndex"
  | "lastLoginDateTime"
>;

/**
 * A simply persistable (can be converted to/from JSON)
 * representation of a user that has been authenticated
 * into the system. This class has a subset of the fields for the user - only
 * those which are unlikely to change within a login session.
 *
 * This class does not contain any permission fields as they
 * must be fetched from the database at the time of any operation.
 */
export class AuthenticatedUser {
  constructor(private readonly dbUser: AuthenticatedUserJsonType) {
    // we are super cautious about data integrity here because we can construct these
    // straight from the db, but also from persisted cookie state
    if (
      isNil(this.dbUser) ||
      isNil(this.dbUser.id) ||
      isNil(this.dbUser.subjectId) ||
      isNil(this.dbUser.displayName) ||
      isNil(this.dbUser.email)
    )
      throw new UnexpectedStateInternalServerError(
        "Cannot instantiate an AuthenticatedUser without being passed a complete user database record"
      );
  }

  /**
   * The internal EdgeDb id for the User record.
   */
  public get dbId(): string {
    return this.dbUser.id;
  }

  /**
   * The OIDC subject identifier for the user in the broader world.
   */
  public get subjectId(): string {
    return this.dbUser.subjectId;
  }

  /**
   * A display name for the user.
   */
  public get displayName(): string {
    return this.dbUser.displayName;
  }

  /**
   * The email address for the user.
   */
  public get email(): string {
    return this.dbUser.email;
  }

  /**
   * For round trip persisting this user in non-database things (cookies for instance)
   * we need to be able to get it back out as the object that was passed in.
   */
  public asJson(): AuthenticatedUserJsonType {
    return this.dbUser;
  }
}
