import * as edgedb from "edgedb";
import { AuthenticatedUser } from "../authenticated-user";
import { inject, injectable } from "tsyringe";
import { UsersService } from "./users-service";
import { ReleaseBaseService } from "./release-base-service";
import { ElsaSettings } from "../../config/elsa-settings";
import { AuditLogService } from "./audit-log-service";
import { AuditDataAccessType } from "@umccr/elsa-types";
import {
  createPagedResult,
  PagedResult,
} from "../../api/helpers/pagination-helpers";

import {
  countReleaseDataEgress,
  getReleaseDataEgress,
  getReleaseDataEgressSummary,
} from "../../../dbschema/queries";

/**
 * A service that coordinates the participation of users in a release
 * and what roles they play in that release.
 */
@injectable()
export class ReleaseDataEgressService extends ReleaseBaseService {
  constructor(
    @inject("Database") edgeDbClient: edgedb.Client,
    @inject("Settings") private settings: ElsaSettings,
    private auditLogService: AuditLogService,
    usersService: UsersService
  ) {
    super(edgeDbClient, usersService);
  }

  public async getSummaryDataAccessAuditByReleaseKey(
    user: AuthenticatedUser,
    releaseKey: string,
    limit: number,
    offset: number
  ) {
    const { userRole } = await this.getBoundaryInfoWithThrowOnFailure(
      user,
      releaseKey
    );

    const dataEgressSummaryResult = await getReleaseDataEgressSummary(
      this.edgeDbClient,
      {
        releaseKey,
        offset,
        limit,
      }
    );

    return createPagedResult(
      dataEgressSummaryResult.results,
      dataEgressSummaryResult.totalCount
    );
  }

  public async getDataAccessAuditByReleaseKey(
    user: AuthenticatedUser,
    releaseKey: string,
    limit: number,
    offset: number
  ) {
    const { userRole } = await this.getBoundaryInfoWithThrowOnFailure(
      user,
      releaseKey
    );

    const totalEntries = await countReleaseDataEgress(this.edgeDbClient, {
      releaseKey,
    });

    const dataEgressArray = await getReleaseDataEgress(this.edgeDbClient, {
      releaseKey,
      offset,
      limit,
    });

    return createPagedResult(dataEgressArray, totalEntries);
  }
}
