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
      isNil(this.dbUser.email) ||
      isNil(this.dbUser.lastLoginDateTime) ||
      isNil(this.dbUser.isAllowedCreateRelease) ||
      isNil(this.dbUser.isAllowedChangeReleaseDataOwner) ||
      isNil(this.dbUser.isAllowedImportDataset)
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
   */
  public get isAllowedViewAllAuditEvents(): boolean {
    return this.dbUser!.isAllowedViewAllAuditEvents;
  }
  public get isAllowedViewDatasetContent(): boolean {
    return this.dbUser!.isAllowedViewDatasetContent;
  }
  public get isAllowedViewUserManagement(): boolean {
    return this.dbUser!.isAllowedViewUserManagement;
  }
  public get isAllowedViewAllReleases(): boolean {
    return this.dbUser!.isAllowedViewAllReleases;
  }

  /**
   * Write permission
   */
  public get isAllowedCreateRelease(): boolean {
    return this.dbUser!.isAllowedCreateRelease;
  }
  public get isAllowedChangeReleaseDataOwner(): boolean {
    return this.dbUser!.isAllowedChangeReleaseDataOwner;
  }
  public get isAllowedImportDataset(): boolean {
    return this.dbUser!.isAllowedImportDataset;
  }
  public get isAllowedSyncDataAccessEvents(): boolean {
    return this.dbUser!.isAllowedSyncDataAccessEvents;
  }

  /**
   * For round trip persisting this user in non-database things (cookies for instance)
   * we need to be able to get it back out as the object that was passed in.
   */
  public asJson(): SingleUserBySubjectIdType {
    return this.dbUser;
  }
}
