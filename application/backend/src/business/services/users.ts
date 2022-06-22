import * as edgedb from "edgedb";
import e, { permission } from "../../../dbschema/edgeql-js";
import { AuthenticatedUser } from "../authenticated-user";

// possibly can somehow get this from the schemas files?
type ReleaseRoleStrings = "DataOwner" | "PI" | "Member";

class UsersService {
  private edgeDbClient = edgedb.createClient();

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
   * Return the role a user has in a particular release, or null if they are not involved
   * in the release.
   *
   * @param user
   * @param releaseId
   */
  public async roleInRelease(
    user: AuthenticatedUser,
    releaseId: string
  ): Promise<ReleaseRoleStrings | null> {
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

export const usersService = new UsersService();
