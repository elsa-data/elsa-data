import * as edgedb from "edgedb";
import { Executor } from "edgedb";
import e from "../../../dbschema/edgeql-js";
import { AuthenticatedUser } from "../authenticated-user";
import { inject, injectable } from "tsyringe";
import { capitalize, isEmpty, isNil, lowerCase } from "lodash";
import {
  createPagedResult,
  PagedResult,
} from "../../api/helpers/pagination-helpers";
import { UserSummaryType } from "@umccr/elsa-types/schemas-users";
import {
  countAllUserQuery,
  deletePotentialUserByEmailQuery,
  pageableAllUserQuery,
  singlePotentialUserByEmailQuery,
  singleUserBySubjectIdQuery,
} from "../db/user-queries";
import { ElsaSettings } from "../../config/elsa-settings";
import {
  addUserAuditEventPermissionChange,
  addUserAuditEventToReleaseQuery,
} from "../db/audit-log-queries";
import {
  NotAuthorisedModifyUserManagement,
  NotAuthorisedViewUserManagement,
} from "../exceptions/user";

// possibly can somehow get this from the schemas files?
export type ReleaseRoleStrings = "Administrator" | "Manager" | "Member";

export type ChangeablePermission = {
  isAllowedRefreshDatasetIndex: boolean;
  isAllowedCreateRelease: boolean;
  isAllowedElsaAdminView: boolean;
};

@injectable()
export class UsersService {
  constructor(
    @inject("Database") private edgeDbClient: edgedb.Client,
    @inject("Settings") private settings: ElsaSettings
  ) {}

  private async checkIsAllowedModifyUserPermission(
    user: AuthenticatedUser
  ): Promise<void> {
    // Check if user has the permission to edit other user permissions
    const isPermissionAllow = user.isAllowedChangeUserPermission;
    if (isPermissionAllow) return;

    throw new NotAuthorisedModifyUserManagement();
  }

  private async checkIsAllowedViewUserManagement(
    user: AuthenticatedUser
  ): Promise<void> {
    // Check if user has the permission to view all audit events
    const isPermissionAllow = user.isAllowedElsaAdminView;
    if (isPermissionAllow) return;

    throw new NotAuthorisedViewUserManagement();
  }

  /**
   * Get all the users.
   *
   * @param user
   * @param limit
   * @param offset
   */
  public async getUsers(
    user: AuthenticatedUser,
    limit: number,
    offset: number
  ): Promise<PagedResult<UserSummaryType>> {
    await this.checkIsAllowedViewUserManagement(user);

    const totalEntries = await countAllUserQuery.run(this.edgeDbClient);

    const pageOfEntries = await pageableAllUserQuery.run(this.edgeDbClient, {
      limit: limit,
      offset: offset,
    });

    return createPagedResult(
      pageOfEntries.map((a) => ({
        id: a.id,
        subjectIdentifier: a.subjectId,
        email: a.email,
        displayName: a.displayName,
        lastLogin: a.lastLoginDateTime,

        // Write Access
        isAllowedChangeUserPermission: a.isAllowedChangeUserPermission,
        isAllowedRefreshDatasetIndex: a.isAllowedRefreshDatasetIndex,
        isAllowedCreateRelease: a.isAllowedCreateRelease,

        // Read Access
        isAllowedElsaAdminView: a.isAllowedElsaAdminView,
      })),
      totalEntries
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
    const dbUser = await singleUserBySubjectIdQuery.run(this.edgeDbClient, {
      subjectId: subjectId,
    });

    if (dbUser != null) return new AuthenticatedUser(dbUser);

    return null;
  }

  /**
   * @param user
   * @param permission
   * @param value
   */
  public async changePermission(
    user: AuthenticatedUser,
    targetEmail: string,
    permission: ChangeablePermission
  ): Promise<void> {
    await this.checkIsAllowedModifyUserPermission(user);

    await e
      .update(e.permission.User, (u) => ({
        filter: e.op(e.str(targetEmail), "=", u.email),
        set: {
          isAllowedRefreshDatasetIndex: permission.isAllowedRefreshDatasetIndex,
          isAllowedCreateRelease: permission.isAllowedCreateRelease,
          isAllowedElsaAdminView: permission.isAllowedElsaAdminView,
          userAuditEvent: {
            "+=": addUserAuditEventPermissionChange(
              user.subjectId,
              user.displayName,
              permission
            ),
          },
        },
      }))
      .run(this.edgeDbClient);
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
   */
  public async upsertUserForLogin(
    subjectId: string,
    displayName: string,
    email: string
  ): Promise<AuthenticatedUser> {
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
      const potentialDbUser = await singlePotentialUserByEmailQuery.run(tx, {
        email: email,
      });

      let releasesToAdd: any;

      if (potentialDbUser) {
        // find all the 'default' settings (like releases they are part of) for the user
        releasesToAdd =
          potentialDbUser.futureReleaseParticipant.length > 0
            ? e.set(
                ...potentialDbUser.futureReleaseParticipant.map((a) =>
                  e.uuid(a.id)
                )
              )
            : e.cast(e.uuid, e.set());

        // the user is no longer potential - they will be real in the users table - so delete from potential
        await deletePotentialUserByEmailQuery.run(tx, {
          email: email,
        });
      } else {
        releasesToAdd = e.cast(e.uuid, e.set());
      }

      const userAuditEvent = e.insert(e.audit.UserAuditEvent, {
        whoId: subjectId,
        whoDisplayName: displayName,
        occurredDateTime: new Date(),
        actionCategory: "E",
        actionDescription: "Login",
        outcome: 0,
      });

      return await e
        .insert(e.permission.User, {
          subjectId: subjectId,
          displayName: displayName,
          email: email,
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
    if (dbUser != null) {
      const newOrUpdatedUser = await this.getBySubjectId(subjectId);

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
   * @param releaseUuid
   * @param role
   */
  public async registerRoleInRelease(
    user: AuthenticatedUser,
    releaseUuid: string,
    role: ReleaseRoleStrings
  ) {
    await UsersService.addUserToReleaseWithRole(
      this.edgeDbClient,
      releaseUuid,
      user.dbId,
      role,
      user.subjectId,
      user.displayName
    );
  }

  /**
   * Add the user as a participant in a release with the given role.
   */
  public static async addUserToReleaseWithRole(
    client: edgedb.Client,
    releaseUuid: string,
    userDbId: string,
    role: string,
    whoId: string,
    whoDisplayName: string
  ) {
    await client.transaction(async (tx) => {
      const release = await e
        .select(e.release.Release, (r) => ({
          releaseKey: true,
          filter_single: { id: r.id },
        }))
        .run(tx);

      await e
        .update(e.permission.User, (u) => ({
          filter: e.op(e.uuid(userDbId), "=", u.id),
          set: {
            releaseParticipant: {
              "+=": e.select(e.release.Release, (r) => ({
                filter: e.op(e.uuid(releaseUuid), "=", r.id),
                "@role": e.str(role),
              })),
            },
            userAuditEvent: {
              "+=": addUserAuditEventToReleaseQuery(
                whoId,
                whoDisplayName,
                role,
                release?.releaseKey
              ),
            },
          },
        }))
        .run(tx);
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
  ): Promise<ReleaseRoleStrings | null> {
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
        ] as ReleaseRoleStrings;
      }
    }

    return null;
  }
}
