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
  releaseGetByReleaseKey,
} from "../../../dbschema/queries";
import { NotAuthorisedSyncDataAccessEvents } from "../exceptions/audit-authorisation";
import { NotAuthorisedViewDataset } from "../exceptions/dataset-authorisation";
import { AwsCloudTrailLakeService } from "./aws-cloudtrail-lake-service";

/**
 * A service that coordinates the participation of users in a release
 * and what roles they play in that release.
 */
@injectable()
export class ReleaseDataEgressService extends ReleaseBaseService {
  constructor(
    @inject("Database") edgeDbClient: edgedb.Client,
    @inject("Settings") private settings: ElsaSettings,
    private awsCloudTrailLakeService: AwsCloudTrailLakeService,
    private auditLogService: AuditLogService,
    usersService: UsersService
  ) {
    super(edgeDbClient, usersService);
  }

  private checkIsAllowedRefreshDatasetIndex(user: AuthenticatedUser): void {
    const isPermissionAllow = user.isAllowedRefreshDatasetIndex;
    if (isPermissionAllow) return;

    throw new NotAuthorisedSyncDataAccessEvents();
  }

  public async syncDataEgressByReleaseKey(
    user: AuthenticatedUser,
    releaseKey: string
  ) {
    this.checkIsAllowedRefreshDatasetIndex(user);

    const datasetUrisArray = (
      await releaseGetByReleaseKey(this.edgeDbClient, {
        releaseKey,
      })
    )?.datasetUris;

    if (!datasetUrisArray) throw new Error("No dataset found!");

    this.awsCloudTrailLakeService.fetchCloudTrailLakeLog({
      user,
      releaseKey,
      datasetUrisArray,
    });
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
