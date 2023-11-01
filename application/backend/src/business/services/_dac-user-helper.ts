import { Executor } from "edgedb";
import _ from "lodash";
import e from "../../../dbschema/edgeql-js";
import {
  potentialUserGetByEmail,
  releaseParticipantAddUser,
  userGetByEmail,
} from "../../../dbschema/queries";
import { AuditEventService } from "./audit-event-service";

export type Role = "Manager" | "Member";

export interface ApplicationUser {
  // the primary key we will try to use to link to future/current users
  email: string;
  // the display name we use (temporarily until email is in the db user)
  displayName: string;
  // the institution which is collected but we probably don't use
  institution?: string;
  // the role we want to assign this person in the release
  role: Role;
}

export const splitUserEmails = (userEmails: string): ApplicationUser[] => {
  return userEmails
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => ({
      email: s,
      displayName: s,
      role: "Member",
    }));
};

// check that a ApplicationUser data structure we have parsed in from external CSV
// has the right field content and types and throw an exception if not
export const checkValidApplicationUser = (
  au: ApplicationUser,
  userDescription: string,
) => {
  const e = `Email/name fields for a person listed in an application must be non-empty strings - in this case user ${userDescription} in the application`;

  if (!_.isString(au.email) || !_.isString(au.displayName)) throw new Error(e);

  if (_.isEmpty(au.email.trim()) || _.isEmpty(au.displayName.trim()))
    throw new Error(e);
};

// set up the users for the release
export const insertPotentialOrReal = async (
  executor: Executor,
  au: ApplicationUser,
  role: Role,
  releaseId: string,
  releaseKey: string,
  auditEventService: AuditEventService,
) => {
  // Find if user had logged in to elsa
  const dbUser = await userGetByEmail(executor, {
    email: au.email,
  });
  const potentialDbUser = await potentialUserGetByEmail(executor, {
    email: au.email,
  });

  if (dbUser) {
    await releaseParticipantAddUser(executor, {
      userUuid: dbUser.id,
      role,
      releaseKey,
    });

    await auditEventService.updateUserAddedToRelease(
      dbUser.subjectId,
      dbUser.displayName,
      role,
      releaseKey,
    );
  } else if (potentialDbUser) {
    // Adding a role to an existing potentialUser record.
    await e
      .update(e.permission.PotentialUser, (pu) => ({
        filter: e.op(e.uuid(potentialDbUser.id), "=", pu.id),
        set: {
          futureReleaseParticipant: {
            "+=": e.select(e.release.Release, (r) => ({
              filter: e.op(e.uuid(releaseId), "=", r.id),
              "@role": e.str(role),
            })),
          },
        },
      }))
      .run(executor);
  } else {
    // A brand new potentialUser with a link role to the release
    await e
      .insert(e.permission.PotentialUser, {
        displayName: au.displayName,
        email: au.email,
        futureReleaseParticipant: e.select(e.release.Release, (r) => ({
          filter: e.op(e.uuid(releaseId), "=", r.id),
          "@role": e.str(role),
        })),
      })
      .assert_single()
      .run(executor);
  }
};
