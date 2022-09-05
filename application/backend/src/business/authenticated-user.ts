import { UnexpectedStateInternalServerError } from "../api/errors/unexpected-state-internal-server-error";
import { isNil } from "lodash";
import { SingleUserBySubjectIdType } from "./db/user-queries";

export class AuthenticatedUser {
  constructor(private readonly dbUser: SingleUserBySubjectIdType) {
    // we are super cautious about data integrity here because we can construct these
    // straight from the db, but also from persisted cookie state
    if (
      isNil(this.dbUser) ||
      isNil(this.dbUser.id) ||
      isNil(this.dbUser.subjectId) ||
      isNil(this.dbUser.displayName) ||
      isNil(this.dbUser.lastLoginDateTime) ||
      isNil(this.dbUser.allowedCreateRelease) ||
      isNil(this.dbUser.allowedChangeReleaseDataOwner) ||
      isNil(this.dbUser.allowedImportDataset)
    )
      throw new UnexpectedStateInternalServerError(
        "Cannot instantiate an AuthenticatedUser without being passed a complete user database record",
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

  public get allowedCreateRelease(): boolean {
    return this.dbUser!.allowedCreateRelease;
  }

  public get allowedChangeReleaseDataOwner(): boolean {
    return this.dbUser!.allowedChangeReleaseDataOwner;
  }

  public get allowedImportDataset(): boolean {
    return this.dbUser!.allowedImportDataset;
  }

  /**
   * For round trip persisting this user in non-database things (cookies for instance)
   * we need to be able to get it back out as the object that was passed in.
   */
  public asJson(): SingleUserBySubjectIdType {
    return this.dbUser;
  }
}
