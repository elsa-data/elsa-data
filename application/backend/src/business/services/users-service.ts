import * as edgedb from "edgedb";
import e from "../../../dbschema/edgeql-js";
import { AuthenticatedUser } from "../authenticated-user";
import { inject, injectable } from "tsyringe";
import { isEmpty, isNil } from "lodash";
import { createPagedResult, PagedResult } from "../../api/api-pagination";
import { UserSummaryType } from "@umccr/elsa-types/schemas-users";
import {
  countAllUserQuery,
  pageableAllUserQuery,
  singleUserBySubjectIdQuery,
} from "../db/user-queries";
import { ElsaSettings } from "../../config/elsa-settings";

// possibly can somehow get this from the schemas files?
export type ReleaseRoleStrings = "DataOwner" | "PI" | "Member";

@injectable()
export class UsersService {
  constructor(
    @inject("Database") private edgeDbClient: edgedb.Client,
    @inject("Settings") private settings: ElsaSettings,
  ) {}

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
    offset: number,
  ): Promise<PagedResult<UserSummaryType>> {
    const totalEntries = await countAllUserQuery.run(this.edgeDbClient);

    const pageOfEntries = await pageableAllUserQuery.run(this.edgeDbClient, {
      limit: limit,
      offset: offset,
    });

    return createPagedResult(
      pageOfEntries.map((a) => ({
        id: a.id,
        subjectIdentifier: a.subjectId,
        displayName: a.displayName,
        lastLogin: a.lastLoginDateTime,
        allowedImportDataset: a.allowedImportDataset,
        allowedCreateRelease: a.allowedCreateRelease,
        allowedChangeReleaseDataOwner: a.allowedChangeReleaseDataOwner,
      })),
      totalEntries,
      limit,
    );
  }

  /**
   * Get a user from our database when given just a subject id. Returns null
   * if the user with that subjectId is not in the database.
   *
   * @param subjectId
   */
  public async getBySubjectId(
    subjectId: string,
  ): Promise<AuthenticatedUser | null> {
    const dbUser = await singleUserBySubjectIdQuery.run(this.edgeDbClient, {
      subjectId: subjectId,
    });

    if (dbUser != null) return new AuthenticatedUser(dbUser);

    return null;
  }

  /**
   * Inserts the user with default settings (if they don't exist) - or update
   * their display name if they do. Sets the 'last login' time of their
   * record to the current time.
   *
   * @param subjectId
   * @param displayName
   */
  public async upsertUserForLogin(
    subjectId: string,
    displayName: string,
  ): Promise<AuthenticatedUser> {
    // this should be handled before hand - but bad things will go
    // wrong if we get passed in empty params
    if (isNil(subjectId) || isEmpty(subjectId.trim()))
      throw Error("Subject id was empty");

    if (isNil(displayName) || isEmpty(displayName.trim()))
      throw Error("Display name was empty");

    const dbUser = await e
      .insert(e.permission.User, {
        subjectId: subjectId,
        displayName: displayName,
      })
      .unlessConflict((u) => ({
        on: u.subjectId,
        else: e.update(u, () => ({
          set: {
            displayName: displayName,
            lastLoginDateTime: e.datetime_current(),
          },
        })),
      }))
      .assert_single()
      .run(this.edgeDbClient);

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
   * @param releaseId
   * @param role
   */
  public async registerRoleInRelease(
    user: AuthenticatedUser,
    releaseId: string,
    role: ReleaseRoleStrings,
  ) {
    await e
      .update(e.permission.User, (u) => ({
        filter: e.op(e.uuid(user.dbId), "=", u.id),
        set: {
          releaseParticipant: {
            "+=": e.select(e.release.Release, (r) => ({
              filter: e.op(e.uuid(releaseId), "=", r.id),
              "@role": e.str(role),
            })),
          },
        },
      }))
      .run(this.edgeDbClient);
  }

  /**
   * Return the role a user has in a particular release, or null if they are not involved
   * in the release. As a by-product, checks that the releaseId is a valid release identifier.
   *
   * @param user
   * @param releaseId
   */
  public async roleInRelease(
    user: AuthenticatedUser,
    releaseId: string,
  ): Promise<ReleaseRoleStrings | null> {
    // TODO: check that releaseId is a valid UUID structure
    // given this is a boundary check function for our routes - we need to protect against being
    // sent release ids that are invalid entirely (as edgedb sends a wierd uuid() error msg)

    const userWithMatchingReleases = await e
      .select(e.permission.User, (u) => ({
        subjectId: true,
        releaseParticipant: (rp) => ({
          id: true,
          "@role": true,
          filter: e.op(rp.id, "=", e.uuid(releaseId)),
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
