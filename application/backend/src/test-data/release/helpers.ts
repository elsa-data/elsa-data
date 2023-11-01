import { Executor } from "edgedb";
import { UserObject } from "../user/helpers";
import e from "../../../dbschema/edgeql-js";

export type InsertReleaseProps = {
  // From User perspective
  releaseAdministrator: UserObject[];
  releaseManager: UserObject[];
  releaseMember: UserObject[];

  // From Datasets
  datasetUris: string[];
};

export const insertRole = async (
  releaseUuid: string,
  userEmail: string,
  role: "Administrator" | "Manager" | "Member",
  edgedbClient: Executor,
) => {
  await e
    .update(e.permission.User, (user) => ({
      filter: e.op(userEmail, "=", user.email),
      set: {
        releaseParticipant: {
          "+=": e.select(e.release.Release, (r) => ({
            filter: e.op(e.uuid(releaseUuid), "=", r.id),
            "@role": e.str(role),
          })),
        },
      },
    }))
    .run(edgedbClient);
};
