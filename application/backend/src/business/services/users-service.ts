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
import {
  countAllUserQuery,
  deletePotentialUserByEmailQuery,
  pageableAllUserQuery,
  singlePotentialUserByEmailQuery,
  singleUserBySubjectIdQuery,
} from "../db/user-queries";
import { ElsaSettings } from "../../config/elsa-settings";

// possibly can somehow get this from the schemas files?
export type ReleaseRoleStrings = "DataOwner" | "PI" | "Member";

@injectable()
export class UsersService {
  constructor(
    @inject("Database") private edgeDbClient: edgedb.Client,
    @inject("Settings") private settings: ElsaSettings
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
    offset: number
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
   * Inserts the user - or update
   * their display name if they do. Sets the 'last login' time of their
   * record to the current time. Note that this function takes into account
   * a secondary table of 'potential' users that may already have some default
   * settings - but who have no yet logged in. This means for instance that a new
   * user can be created already associated with a release.
   *
   * @param subjectId
   * @param displayName
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

      return await e
        .insert(e.permission.User, {
          subjectId: subjectId,
          displayName: displayName,
          email: email,
          releaseParticipant: e.select(e.release.Release, (r) => ({
            filter: e.op(r.id, "in", releasesToAdd),
            "@role": e.str("Member"),
          })),
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
   * @param releaseId
   * @param role
   */
  public async registerRoleInRelease(
    user: AuthenticatedUser,
    releaseUuid: string,
    role: ReleaseRoleStrings
  ) {
    await e
      .update(e.permission.User, (u) => ({
        filter: e.op(e.uuid(user.dbId), "=", u.id),
        set: {
          releaseParticipant: {
            "+=": e.select(e.release.Release, (r) => ({
              filter: e.op(e.uuid(releaseUuid), "=", r.id),
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
    releaseId: string
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
          filter: e.op(rp.releaseIdentifier, "=", releaseId),
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
