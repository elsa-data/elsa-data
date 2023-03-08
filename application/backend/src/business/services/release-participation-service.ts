import * as edgedb from "edgedb";
import { AuthenticatedUser } from "../authenticated-user";
import { doRoleInReleaseCheck, getReleaseInfo } from "./helpers";
import { inject, injectable } from "tsyringe";
import { UsersService } from "./users-service";
import { ReleaseBaseService } from "./release-base-service";
import { ElsaSettings } from "../../config/elsa-settings";
import {
  releaseParticipantAddPotentialUser,
  releaseParticipantAddUser,
  releaseParticipantGetAll,
  releaseParticipantRemovePotentialUser,
  releaseParticipantRemoveUser,
} from "../../../dbschema/queries";
import { touchRelease } from "../db/release-queries";
import { ReleaseParticipationPermissionError } from "../exceptions/release-participation";
import {
  singlePotentialUserByEmailQuery,
  singleUserByEmailQuery,
} from "../db/user-queries";
import e from "../../../dbschema/edgeql-js";
import {
  AuditLogService,
  OUTCOME_MINOR_FAILURE,
  OUTCOME_SERIOUS_FAILURE,
  OUTCOME_SUCCESS,
} from "./audit-log-service";

/**
 * A service that coordinates the participation of users in a release
 * and what roles they play in that release.
 */
@injectable()
export class ReleaseParticipationService extends ReleaseBaseService {
  constructor(
    @inject("Database") edgeDbClient: edgedb.Client,
    @inject("Settings") private settings: ElsaSettings,
    private auditLogService: AuditLogService,
    usersService: UsersService
  ) {
    super(edgeDbClient, usersService);
  }

  public async getParticipants(user: AuthenticatedUser, releaseId: string) {
    const { userRole } = await doRoleInReleaseCheck(
      this.usersService,
      user,
      releaseId
    );

    // NOTE: for 'reading' participant information (i.e. this call) we are happy for anyone involved
    // to see the details of everyone in the release (it's hard to imagine a research
    // collaboration where actual data collaborators are not allowed to see each others email?)

    return await releaseParticipantGetAll(this.edgeDbClient, {
      releaseId: releaseId,
    });
  }

  /**
   * Add a participant in to a release where the participant is identified by email
   * address and is added with the given role.
   *
   * Handles correctly the cases where users may not exist and a pseudo user
   * needs to be created until they log in.
   *
   * @param user the user performing the operation
   * @param releaseId the release to change the participation of
   * @param newUserEmail the email address of the user to add
   * @param newUserRole the role the user should have in the release
   */
  public async addParticipant(
    user: AuthenticatedUser,
    releaseId: string,
    newUserEmail: string,
    newUserRole: string
  ) {
    const { userRole } = await doRoleInReleaseCheck(
      this.usersService,
      user,
      releaseId
    );

    const now = new Date();
    const newAuditEventId = await this.auditLogService.startReleaseAuditEvent(
      this.edgeDbClient,
      user,
      releaseId,
      "E",
      "Add Participant",
      now
    );

    try {
      // right to add participants must be limited to DataOwners and PIs
      if (userRole !== "DataOwner" && userRole !== "PI") {
        throw new ReleaseParticipationPermissionError(releaseId);
      }

      const userOrPotentialUserUuid = await this.edgeDbClient.transaction(
        async (tx) => {
          // we have three scenarios to handle
          // (1) the user exists in Elsa and we just need to link them to the release
          // (2) the user has not logged in but does exist already as a PotentialUser - we need to link them to the release
          // (3) the user is completely new and we need to create and link as a PotentialUser

          // (1)
          const dbUser = await singleUserByEmailQuery.run(tx, {
            email: newUserEmail,
          });

          if (dbUser) {
            await releaseParticipantAddUser(tx, {
              userUuid: dbUser.id,
              releaseId: releaseId,
              role: newUserRole,
            });
            return dbUser.id;
          }

          // (2)
          const potentialDbUser = await singlePotentialUserByEmailQuery.run(
            tx,
            {
              email: newUserEmail,
            }
          );

          if (potentialDbUser) {
            await releaseParticipantAddPotentialUser(tx, {
              potentialUserUuid: potentialDbUser.id,
              releaseId: releaseId,
              role: newUserRole,
            });
            return potentialDbUser.id;
          }

          // (3)
          const newPotential = await e
            .insert(e.permission.PotentialUser, {
              displayName: newUserEmail,
              email: newUserEmail,
              futureReleaseParticipant: e.select(e.release.Release, (r) => ({
                filter: e.op(releaseId, "=", r.releaseIdentifier),
                "@role": e.str(newUserRole),
              })),
            })
            .assert_single()
            .run(tx);

          if (newPotential) return newPotential.id;
          else throw new Error("New Potential User failed to add");
        }
      );

      await this.auditLogService.completeReleaseAuditEvent(
        this.edgeDbClient,
        newAuditEventId,
        0,
        now,
        new Date(),
        {
          email: newUserEmail,
          role: newUserRole,
          affectedUserOrPotentialUser: userOrPotentialUserUuid,
        }
      );

      return userOrPotentialUserUuid;
    } catch (e) {
      const errorString = e instanceof Error ? e.message : String(e);

      await this.auditLogService.completeReleaseAuditEvent(
        this.edgeDbClient,
        newAuditEventId,
        8,
        now,
        new Date(),
        { error: errorString }
      );

      throw e;
    }
  }

  public async removeParticipant(
    user: AuthenticatedUser,
    releaseId: string,
    participantUuid: string
  ) {
    const { userRole } = await doRoleInReleaseCheck(
      this.usersService,
      user,
      releaseId
    );

    const now = new Date();
    const newAuditEventId = await this.auditLogService.startReleaseAuditEvent(
      this.edgeDbClient,
      user,
      releaseId,
      "E",
      "Remove Participant",
      now
    );

    try {
      // deleting participants must be limited to DataOwners and PIs
      if (userRole !== "DataOwner" && userRole !== "PI") {
        throw new ReleaseParticipationPermissionError(releaseId);
      }

      const actuallyRemoved = await this.edgeDbClient.transaction(
        async (tx) => {
          // NOTE: we use the normal EdgeDb semantics to say that doing a "-=" where the unliked item IS NOT PRESENT
          // IS NOT AN ERROR i.e. deleting someone from a release who is not in the release
          // WE COULD DECIDE TO DO THIS DIFFERENTLY (?)

          // we are actually pretty loose here on checking the participant and release existence.. but I can't
          // think of any way it affects things
          // if the participantUuid is invalid - then nothing happens
          // if the participantUuid is not actually in *this* release - then nothing happens
          // the releaseUuid *is* tested so we know the instigator exists and has some permissions

          const userRemoved = await releaseParticipantRemoveUser(tx, {
            userUuid: participantUuid,
            releaseId: releaseId,
          });
          const potentialUserRemoved =
            await releaseParticipantRemovePotentialUser(tx, {
              potentialUserUuid: participantUuid,
              releaseId: releaseId,
            });

          // altering the participation of a release counts as a touch
          await touchRelease.run(tx, { releaseIdentifier: releaseId });

          // return true if we actually removed someone, false otherwise
          return userRemoved || potentialUserRemoved;
        }
      );

      await this.auditLogService.completeReleaseAuditEvent(
        this.edgeDbClient,
        newAuditEventId,
        actuallyRemoved ? OUTCOME_SUCCESS : OUTCOME_MINOR_FAILURE,
        now,
        new Date()
      );
    } catch (e) {
      const errorString = e instanceof Error ? e.message : String(e);

      await this.auditLogService.completeReleaseAuditEvent(
        this.edgeDbClient,
        newAuditEventId,
        OUTCOME_SERIOUS_FAILURE,
        now,
        new Date(),
        { error: errorString }
      );

      throw e;
    }
  }
}
