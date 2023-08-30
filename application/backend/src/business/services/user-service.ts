import * as edgedb from "edgedb";
import e from "../../../dbschema/edgeql-js";
import { AuthenticatedUser } from "../authenticated-user";
import { inject, injectable } from "tsyringe";
import { isEmpty, isNil } from "lodash";
import {
  createPagedResult,
  PagedResult,
} from "../../api/helpers/pagination-helpers";
import { UserSummaryType } from "@umccr/elsa-types/schemas-users";
import { ElsaSettings } from "../../config/elsa-settings";
import {
  NonExistentUser,
  NotAuthorisedEditUserManagement,
  NotAuthorisedGetOwnUser,
  UserExist,
} from "../exceptions/user";
import {
  potentialUserDeleteByEmail,
  potentialUserGetByEmail,
  potentialUserInsert,
  releaseParticipantAddUser,
  userGetAllByUser,
  userGetByDbId,
  userGetByEmail,
  userGetBySubjectId,
  userUpdatePermissions,
} from "../../../dbschema/queries";
import { IPLookupService, LocationType } from "./ip-lookup-service";
import { ReleaseParticipantRoleType } from "@umccr/elsa-types";
import { UserData } from "../data/user-data";
import { AuditEventService } from "./audit-event-service";

export type ChangeablePermission = {
  isAllowedRefreshDatasetIndex: boolean;
  isAllowedCreateRelease: boolean;
  isAllowedOverallAdministratorView: boolean;
};

export type LoginDetailType = {
  ip: string;
  ipLocation?: LocationType;
};

@injectable()
export class UserService {
  constructor(
    @inject("Database") private readonly edgeDbClient: edgedb.Client,
    @inject("Settings") private readonly settings: ElsaSettings,
    @inject(IPLookupService) private readonly ipLookupService: IPLookupService,
    @inject(UserData) private readonly userData: UserData,
    @inject(AuditEventService)
    private readonly auditEventService: AuditEventService
  ) {}

  /**
   * Return whether the given subject id is for a super admin
   * (who are given a small set of additional rights by virtue of being
   * listed). For instance - this might give them the right to
   * "alter other user permissions".
   *
   * @param subjectId
   */
  public isConfiguredSuperAdmin(subjectId: string): boolean {
    for (const su of this.settings.superAdmins || []) {
      if (su.sub === subjectId) return true;
    }

    return false;
  }
  /**
   * Get its own authenticated user
   */
  public async getOwnUser(user: AuthenticatedUser): Promise<UserSummaryType> {
    const currentUser = await userGetByDbId(this.edgeDbClient, {
      dbId: user.dbId,
    });

    if (!currentUser) throw new NotAuthorisedGetOwnUser(user.subjectId);

    return {
      id: currentUser.id,
      subjectIdentifier: currentUser.subjectId,
      email: currentUser.email,
      displayName: currentUser.displayName,
      lastLogin: currentUser.lastLoginDateTime,

      // Write Access
      isAllowedChangeUserPermission: this.isConfiguredSuperAdmin(
        currentUser.subjectId
      ),
      isAllowedRefreshDatasetIndex: currentUser.isAllowedRefreshDatasetIndex,
      isAllowedCreateRelease: currentUser.isAllowedCreateRelease,

      // Read Access
      isAllowedOverallAdministratorView:
        currentUser.isAllowedOverallAdministratorView,
    };
  }

  /**
   * Get all the users. Users always have permission to make this call, but
   * will be limited in which records are returned to them if they do
   * not have broader permissions than an ordinary user.
   *
   * @param user the user making the call
   * @param limit
   * @param offset
   */
  public async getUsers(
    user: AuthenticatedUser,
    limit: number,
    offset: number
  ): Promise<PagedResult<UserSummaryType>> {
    const { total, data } = await userGetAllByUser(this.edgeDbClient, {
      userDbId: user.dbId,
      isSuperAdmin: this.isConfiguredSuperAdmin(user.subjectId),
      offset: offset,
      limit: limit,
    });

    return createPagedResult(
      data.map((a) => ({
        id: a.id,
        subjectIdentifier: a.subjectId,
        email: a.email,
        displayName: a.displayName,
        lastLogin: a.lastLoginDateTime,

        // Write Access
        isAllowedChangeUserPermission: this.isConfiguredSuperAdmin(a.subjectId),
        isAllowedRefreshDatasetIndex: a.isAllowedRefreshDatasetIndex,
        isAllowedCreateRelease: a.isAllowedCreateRelease,

        // Read Access
        isAllowedOverallAdministratorView: a.isAllowedOverallAdministratorView,
      })),
      total
    );
  }

  /**
   * Get a user from our database when given just a subject id. Returns null
   * if the user with that subjectId is not in the database.
   *
   * @param subjectId
   */
  public async getBySubjectId(
    subjectId: string
  ): Promise<AuthenticatedUser | null> {
    const dbUser = await userGetBySubjectId(this.edgeDbClient, {
      subjectId: subjectId,
    });

    if (dbUser != null) return new AuthenticatedUser(dbUser);

    return null;
  }

  /**
   * @param user
   * @param targetSubjectId
   * @param permission
   */
  public async changePermission(
    user: AuthenticatedUser,
    targetSubjectId: string,
    permission: ChangeablePermission
  ): Promise<void> {
    if (!this.isConfiguredSuperAdmin(user.subjectId))
      throw new NotAuthorisedEditUserManagement();

    await this.edgeDbClient.transaction(async (tx) => {
      const targetUser = await userGetBySubjectId(tx, {
        subjectId: targetSubjectId,
      });

      if (targetUser === undefined || targetUser === null) {
        throw new NonExistentUser(targetSubjectId);
      }

      await userUpdatePermissions(tx, {
        subjectId: targetUser.subjectId,
        isAllowedRefreshDatasetIndex: permission.isAllowedRefreshDatasetIndex,
        isAllowedCreateRelease: permission.isAllowedCreateRelease,
        isAllowedOverallAdministratorView:
          permission.isAllowedOverallAdministratorView,
      });

      await this.auditEventService.updateUserPermissionsChanged(
        user.subjectId,
        user.displayName,
        permission,
        this.edgeDbClient
      );
    });
  }

  public async addPotentialUser(
    user: AuthenticatedUser,
    newPotentialUserEmail: string,
    permission: ChangeablePermission
  ): Promise<void> {
    if (!this.isConfiguredSuperAdmin(user.subjectId))
      throw new NotAuthorisedEditUserManagement();

    await this.edgeDbClient.transaction(async (tx) => {
      // We need to check if the potential email exist
      const potentialUser = await potentialUserGetByEmail(tx, {
        email: newPotentialUserEmail,
      });
      const activeUser = await userGetByEmail(tx, {
        email: newPotentialUserEmail,
      });
      if (!!potentialUser || !!activeUser) {
        throw new UserExist(newPotentialUserEmail);
      }

      // If it made this far, we need to insert new potentialUser
      const start = new Date();
      const aeId = await this.auditEventService.startUserAuditEvent(
        user.subjectId,
        user.displayName,
        user.dbId,
        "E",
        `Add a potential user: ${newPotentialUserEmail}`,
        start,
        tx
      );

      await potentialUserInsert(tx, {
        email: newPotentialUserEmail,
        isAllowedRefreshDatasetIndex: permission.isAllowedRefreshDatasetIndex,
        isAllowedCreateRelease: permission.isAllowedCreateRelease,
        isAllowedOverallAdministratorView:
          permission.isAllowedOverallAdministratorView,
      });

      await this.auditEventService.completeUserAuditEvent(
        aeId,
        0,
        start,
        new Date(),
        {
          email: newPotentialUserEmail,
          isAllowedRefreshDatasetIndex: permission.isAllowedRefreshDatasetIndex,
          isAllowedCreateRelease: permission.isAllowedCreateRelease,
          isAllowedOverallAdministratorView:
            permission.isAllowedOverallAdministratorView,
        },
        tx
      );
    });
  }

  /**
   * Return true if the given subjectId or email exists in this Elsa Data
   * instance - which implies that we will let them log in.
   *
   * They can exist as a User, a PotentialUser, or are listed as a super
   * admin in the configuration.
   *
   * @param subjectId
   * @param email
   */
  public async existsForLogin(
    subjectId: string,
    email: string
  ): Promise<boolean> {
    const isSuper = this.settings.superAdmins.find(
      (sa) => sa.sub === subjectId
    );

    // if the users subject id is listed in the super admins then they are allowed to login
    if (isSuper) return true;

    return await this.edgeDbClient.transaction(async (tx) => {
      const actualDbUser = await userGetByEmail(tx, {
        email: email,
      });

      if (actualDbUser) return true;

      const potentialDbUser = await potentialUserGetByEmail(tx, {
        email: email,
      });

      return !!potentialDbUser;
    });
  }

  /**
   * Inserts the user - or update
   * their display name if they do. Sets the 'last login' time of their
   * record to the current time. Note that this function takes into account
   * a secondary table of 'potential' users that may already have some default
   * settings - but who have no yet logged in. This means for instance that a new
   * user can be created already associated with a release. Creates an audit event
   * for the login.
   *
   * @param subjectId
   * @param displayName
   * @param email
   * @param auditDetails if present, JSON data that will be attached to the Login audit event (for IP etc)
   */
  public async upsertUserForLogin(
    subjectId: string,
    displayName: string,
    email: string,
    auditDetails?: LoginDetailType
  ) {
    // this should be handled beforehand - but bad things will go
    // wrong if we get pass in empty params - so we check again
    if (isNil(subjectId) || isEmpty(subjectId.trim()))
      throw Error("Subject id was empty");

    if (isNil(displayName) || isEmpty(displayName.trim()))
      throw Error("Display name was empty");

    if (isNil(email) || isEmpty(email.trim()))
      throw Error("Email name was empty");

    const dbUser = await this.edgeDbClient.transaction(async (tx) => {
      // did we already perhaps see reference to this user from an application - but the user hasn't logged in?
      const potentialDbUser = await potentialUserGetByEmail(tx, {
        email: email,
      });

      let releasesToAdd: any;

      if (potentialDbUser) {
        // find all the 'default' settings (like releases they are part of) for the user
        releasesToAdd =
          potentialDbUser.futureReleaseParticipant &&
          potentialDbUser.futureReleaseParticipant.length > 0
            ? e.set(
                ...potentialDbUser.futureReleaseParticipant.map((a) =>
                  e.uuid(a.id)
                )
              )
            : e.cast(e.uuid, e.set());

        // the user is no longer potential - they will be real in the users table - so delete from potential
        await potentialUserDeleteByEmail(tx, {
          email: email,
        });
      } else {
        releasesToAdd = e.cast(e.uuid, e.set());
      }

      const ipAddress = auditDetails?.ip;
      if (ipAddress) {
        auditDetails["ipLocation"] =
          this.ipLookupService.getLocationByIp(ipAddress);
      }

      const userAuditEvent = e.insert(e.audit.UserAuditEvent, {
        whoId: subjectId,
        whoDisplayName: displayName,
        occurredDateTime: new Date(),
        actionCategory: "E",
        actionDescription: "Login",
        outcome: 0,
        details: auditDetails,
        inProgress: false,
      });

      return await e
        .insert(e.permission.User, {
          subjectId: subjectId,
          displayName: displayName,
          email: email,
          // we are explicit here about our default permissions being "no permissions"
          isAllowedOverallAdministratorView: false,
          isAllowedCreateRelease: false,
          isAllowedRefreshDatasetIndex: false,
          releaseParticipant: e.select(e.release.Release, (r) => ({
            filter: e.op(r.id, "in", releasesToAdd),
            "@role": e.str("Member"),
          })),
          userAuditEvent: userAuditEvent,
        })
        .unlessConflict((u) => ({
          on: u.subjectId,
          else: e.update(u, () => ({
            set: {
              displayName: displayName,
              lastLoginDateTime: e.datetime_current(),
              userAuditEvent: { "+=": userAuditEvent },
            },
          })),
        }))
        .assert_single()
        .run(tx);
    });

    // there is no way to get the upsert to also return the other db fields so we
    // have to requery if we want to return a full authenticated user here
    if (dbUser !== null) {
      const newOrUpdatedUser = await this.userData.getDbUserByDbId(
        this.edgeDbClient,
        dbUser.id
      );

      if (newOrUpdatedUser) return newOrUpdatedUser;
    }

    throw new Error("Couldn't create user");
  }

  /**
   * Register the calling user with a given role in the release.
   *
   * If the user already has a role in the release then this function
   * aborts with an exception.
   *
   * @param user
   * @param releaseKey
   * @param role
   */
  public async registerRoleInRelease(
    user: AuthenticatedUser,
    releaseKey: string,
    role: ReleaseParticipantRoleType
  ) {
    await UserService.addUserToReleaseWithRole(
      this.edgeDbClient,
      releaseKey,
      user.dbId,
      role,
      user.subjectId,
      user.displayName,
      this.auditEventService
    );
  }

  /**
   * Add the user as a participant in a release with the given role.
   */
  public static async addUserToReleaseWithRole(
    client: edgedb.Client,
    releaseKey: string,
    userDbId: string,
    role: string,
    subjectId: string,
    whoDisplayName: string,
    auditEventService: AuditEventService
  ) {
    await client.transaction(async (tx) => {
      await releaseParticipantAddUser(tx, {
        userUuid: userDbId,
        role,
        releaseKey,
      });

      await auditEventService.updateUserAddedToRelease(
        subjectId,
        whoDisplayName,
        role,
        releaseKey,
        client
      );
    });
  }

  /**
   * Return the role a user has in a particular release, or null if they are not involved
   * in the release. As a by-product, checks that the releaseKey is a valid key.
   *
   * @param user
   * @param releaseKey
   */
  public async roleInRelease(
    user: AuthenticatedUser,
    releaseKey: string
  ): Promise<ReleaseParticipantRoleType | null> {
    // TODO: check that releaseKey is a valid UUID structure
    // given this is a boundary check function for our routes - we need to protect against being
    // sent release ids that are invalid entirely (as edgedb sends a wierd uuid() error msg)

    const userWithMatchingReleases = await e
      .select(e.permission.User, (u) => ({
        subjectId: true,
        releaseParticipant: (rp) => ({
          id: true,
          "@role": true,
          filter: e.op(rp.releaseKey, "=", releaseKey),
        }),
        filter: e.op(e.str(user.subjectId), "=", u.subjectId),
      }))
      .run(this.edgeDbClient);

    if (userWithMatchingReleases) {
      if (
        userWithMatchingReleases.length > 0 &&
        userWithMatchingReleases[0].releaseParticipant.length > 0
      ) {
        return userWithMatchingReleases[0].releaseParticipant[0][
          "@role"
        ] as ReleaseParticipantRoleType;
      }
    }

    return null;
  }
}
