import * as edgedb from "edgedb";
import e, { permission } from "../../../dbschema/edgeql-js";
import { DatasetDeepType, DatasetLightType } from "@umccr/elsa-types";
import { AuthUser } from "../../auth/auth-user";
import { sub } from "edgedb/dist/primitives/bigint";
import { AuthenticatedUser } from "../authenticated-user";
import { filter } from "lodash";

export type UserId = string;

class UsersService {
  private edgeDbClient = edgedb.createClient();

  private baseUserSelect(subjectId: string) {
    return e
      .select(e.permission.User, (u) => ({
        ...e.permission.User["*"],
        filter: e.op(e.str(subjectId), "=", u.subjectId),
      }))
      .assert_single();
  }

  public async getBySubjectId(
    subjectId: string
  ): Promise<AuthenticatedUser | null> {
    const dbUser = await this.baseUserSelect(subjectId).run(this.edgeDbClient);

    if (dbUser != null) return new AuthenticatedUser(dbUser);

    return null;
  }

  public async roleInRelease(
    user: AuthenticatedUser,
    releaseId: string
  ): Promise<string | null> {
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
        return userWithMatchingReleases[0].releaseParticipant[0]["@role"];
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
        return "Owner";
        // currently there is no role for datasets other than owning them
        // userWithMatchingDatasets[0].datasetOwner[0]['@role'];
      }
    }

    return null;
  }
}

export const usersService = new UsersService();
