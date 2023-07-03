import { UnexpectedStateInternalServerError } from "../api/errors/unexpected-state-internal-server-error";
import { isNil } from "lodash";
import { SingleUserBySubjectIdType } from "./data/user-data";

export class AuthenticatedUser {
  constructor(private readonly dbUser: SingleUserBySubjectIdType) {
    // we are super cautious about data integrity here because we can construct these
    // straight from the db, but also from persisted cookie state
    if (
      isNil(this.dbUser) ||
      isNil(this.dbUser.id) ||
      isNil(this.dbUser.subjectId) ||
      isNil(this.dbUser.displayName) ||
      isNil(this.dbUser.email) ||
      isNil(this.dbUser.lastLoginDateTime) ||
      isNil(this.dbUser.isAllowedRefreshDatasetIndex) ||
      isNil(this.dbUser.isAllowedCreateRelease) ||
      isNil(this.dbUser.isAllowedOverallAdministratorView)
    )
      throw new UnexpectedStateInternalServerError(
        "Cannot instantiate an AuthenticatedUser without being passed a complete user database record"
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
    return this.dbUser!.displayName;
  }

  public get email(): string {
    return this.dbUser!.email;
  }

  /**
   * Read permission
   * @deprecated moving our queries over to using the field directly from the db
   */
  public get isAllowedOverallAdministratorView(): boolean {
    return this.dbUser!.isAllowedOverallAdministratorView;
  }

  /**
   * Write permission
   * @deprecated moving our queries over to using the field directly from the db
   */
  public get isAllowedCreateRelease(): boolean {
    return this.dbUser!.isAllowedCreateRelease;
  }

  /**
   * @deprecated moving our queries over to using the field directly from the db
   */
  public get isAllowedRefreshDatasetIndex(): boolean {
    return this.dbUser!.isAllowedRefreshDatasetIndex;
  }

  /**
   * For round trip persisting this user in non-database things (cookies for instance)
   * we need to be able to get it back out as the object that was passed in.
   */
  public asJson(): SingleUserBySubjectIdType {
    return this.dbUser;
  }
}
