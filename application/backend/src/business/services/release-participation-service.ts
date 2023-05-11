import * as edgedb from "edgedb";
import { AuthenticatedUser } from "../authenticated-user";
import { inject, injectable } from "tsyringe";
import { UserService } from "./user-service";
import { ReleaseBaseService } from "./release-base-service";
import { ElsaSettings } from "../../config/elsa-settings";
import {
  releaseParticipantAddPotentialUser,
  releaseParticipantAddUser,
  releaseParticipantGetAll,
  releaseParticipantRemovePotentialUser,
  releaseParticipantRemoveUser,
} from "../../../dbschema/queries";
import { ReleaseParticipationPermissionError } from "../exceptions/release-participation";
import {
  singlePotentialUserByEmailQuery,
  singleUserByEmailQuery,
} from "../db/user-queries";
import e from "../../../dbschema/edgeql-js";
import { AuditEventService } from "./audit-event-service";

/**
 * A service that coordinates the participation of users in a release
 * and what roles they play in that release.
 */
@injectable()
export class ReleaseParticipationService extends ReleaseBaseService {
  constructor(
    @inject("Database") edgeDbClient: edgedb.Client,
    @inject("Settings") settings: ElsaSettings,
    @inject("Features") features: ReadonlySet<string>,
    @inject(AuditEventService)
    private readonly auditLogService: AuditEventService,
    @inject(UserService) userService: UserService
  ) {
    super(settings, edgeDbClient, features, userService);
  }

  public async getParticipants(user: AuthenticatedUser, releaseKey: string) {
    const { userRole } = await this.getBoundaryInfoWithThrowOnFailure(
      user,
      releaseKey
    );

    // NOTE: for 'reading' participant information (i.e. this call) we are happy for anyone involved
    // to see the details of everyone in the release (it's hard to imagine a research
    // collaboration where actual data collaborators are not allowed to see each others email?)

    return await releaseParticipantGetAll(this.edgeDbClient, {
      releaseKey: releaseKey,
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
   * @param releaseKey the release to change the participation of
   * @param newUserEmail the email address of the user to add
   * @param newUserRole the role the user should have in the release
   */
  public async addParticipant(
    user: AuthenticatedUser,
    releaseKey: string,
    newUserEmail: string,
    newUserRole: string
  ) {
    const { userRole } = await this.getBoundaryInfoWithThrowOnFailure(
      user,
      releaseKey
    );

    return await this.auditLogService.transactionalUpdateInReleaseAuditPattern(
      user,
      releaseKey,
      "Add Participant",
      async () => {
        // right to add participants must be limited to Administrator and Manager
        if (userRole !== "Administrator" && userRole !== "Manager") {
          throw new ReleaseParticipationPermissionError(releaseKey);
        }
      },
      async (tx, a) => {
        // a datastructure we pass to the next stage AND which we put into the Audit log details
        const auditLogDetail = (id: string) => ({
          email: newUserEmail,
          role: newUserRole,
          affectedUserOrPotentialUser: id,
        });

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
            releaseKey: releaseKey,
            role: newUserRole,
          });
          return auditLogDetail(dbUser.id);
        }

        // (2)
        const potentialDbUser = await singlePotentialUserByEmailQuery.run(tx, {
          email: newUserEmail,
        });

        if (potentialDbUser) {
          await releaseParticipantAddPotentialUser(tx, {
            potentialUserUuid: potentialDbUser.id,
            releaseKey: releaseKey,
            role: newUserRole,
          });
          return auditLogDetail(potentialDbUser.id);
        }

        // (3)
        const newPotential = await e
          .insert(e.permission.PotentialUser, {
            displayName: newUserEmail,
            email: newUserEmail,
            futureReleaseParticipant: e.select(e.release.Release, (r) => ({
              filter: e.op(releaseKey, "=", r.releaseKey),
              "@role": e.str(newUserRole),
            })),
          })
          .assert_single()
          .run(tx);

        if (newPotential) return auditLogDetail(newPotential.id);

        throw new Error("New Potential User failed to add");
      },
      async (a) => {
        return a.affectedUserOrPotentialUser;
      }
    );
  }

  public async removeParticipant(
    user: AuthenticatedUser,
    releaseKey: string,
    participantUuid: string
  ) {
    const { userRole } = await this.getBoundaryInfoWithThrowOnFailure(
      user,
      releaseKey
    );

    await this.auditLogService.transactionalUpdateInReleaseAuditPattern(
      user,
      releaseKey,
      "Remove Participant",
      async () => {
        // deleting participants must be limited to Administrator and Managers
        if (userRole !== "Administrator" && userRole !== "Manager") {
          throw new ReleaseParticipationPermissionError(releaseKey);
        }
      },
      async (tx, a) => {
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
          releaseKey: releaseKey,
        });
        const potentialUserRemoved =
          await releaseParticipantRemovePotentialUser(tx, {
            potentialUserUuid: participantUuid,
            releaseKey: releaseKey,
          });

        return {
          actualUserRemoved:
            userRemoved?.id ?? potentialUserRemoved?.id ?? "none",
        };
      },
      async (a) => {}
    );
  }
}
