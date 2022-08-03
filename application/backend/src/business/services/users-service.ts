import * as edgedb from "edgedb";
import e from "../../../dbschema/edgeql-js";
import { AuthenticatedUser } from "../authenticated-user";
import { inject, injectable } from "tsyringe";

// possibly can somehow get this from the schemas files?
export type ReleaseRoleStrings = "DataOwner" | "PI" | "Member";

@injectable()
export class UsersService {
  constructor(@inject("Database") private edgeDbClient: edgedb.Client) {}

  private baseUserSelectQuery(subjectId: string) {
    // TODO: convert this to use edge parameters?
    return e
      .select(e.permission.User, (u) => ({
        ...e.permission.User["*"],
        filter: e.op(e.str(subjectId), "=", u.subjectId),
      }))
      .assert_single();
  }

  /**
   * Get a user from our database when given just a subject id. Returns null
   * if the user is not in the database.
   *
   * @param subjectId
   */
  public async getBySubjectId(
    subjectId: string
  ): Promise<AuthenticatedUser | null> {
    const dbUser = await this.baseUserSelectQuery(subjectId).run(
      this.edgeDbClient
    );

    if (dbUser != null) return new AuthenticatedUser(dbUser);

    return null;
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
    role: ReleaseRoleStrings
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

  public async roleInDataset(
    user: AuthenticatedUser,
    datasetId: string
  ): Promise<string | null> {
    const userWithMatchingDatasets = await e
      .select(e.permission.User, (u) => ({
        subjectId: true,
        datasetOwner: (d) => ({
          id: true,
          filter: e.op(d.id, "=", e.uuid(datasetId)),
        }),
        filter: e.op(e.str(user.subjectId), "=", u.subjectId),
      }))
      .run(this.edgeDbClient);

    if (userWithMatchingDatasets) {
      if (
        userWithMatchingDatasets.length > 0 &&
        userWithMatchingDatasets[0].datasetOwner.length > 0
      ) {
        return "DataOwner";
        // currently there is no role for datasets other than owning them
        // userWithMatchingDatasets[0].datasetOwner[0]['@role'];
      }
    }

    return null;
  }
}
