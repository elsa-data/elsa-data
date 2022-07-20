import * as edgedb from "edgedb";
import e from "../../../dbschema/edgeql-js";
import { ReleaseSummaryType } from "@umccr/elsa-types";
import { AuthenticatedUser } from "../authenticated-user";
import { inject, injectable } from "tsyringe";
import { UsersService } from "./users-service";

@injectable()
export class AuditLogService {
  constructor(
    @inject("Database") private edgeDbClient: edgedb.Client,
    private usersService: UsersService
  ) {}

  /**
   *
   */
  public async auditEvent(
    releaseId: string,
    user: AuthenticatedUser,
    what: string,
    start: Date,
    end?: Date
  ): Promise<void> {
    await e
      .insert(e.audit.AuditEvent, {
        occurredDateTime: start,
        recordedDateTime: e.datetime_current(),
        what: what,
      })
      .run(this.edgeDbClient);
  }

  public async getAll(
    releaseId: string,
    user: AuthenticatedUser,
    limit: number,
    offset: number
  ): Promise<ReleaseSummaryType[]> {
    const allForUser = await e
      .select(e.release.Release, (r) => ({
        ...e.release.Release["*"],
        runningJob: {
          percentDone: true,
        },
        userRoles: e.select(
          r["<releaseParticipant[is permission::User]"],
          (u) => ({
            id: true,
            filter: e.op(u.id, "=", e.uuid(user.dbId)),
            // "@role": true
          })
        ),
      }))
      .run(this.edgeDbClient);

    return allForUser
      .filter((a) => a.userRoles != null)
      .map((a) => ({
        id: a.id,
        datasetUris: a.datasetUris,
        applicationDacIdentifier:
          a?.applicationDacIdentifier ?? "<unidentified>",
        applicationDacTitle: a?.applicationDacTitle ?? "<untitled>",
        isRunningJobPercentDone: undefined,
      }));
  }
}
