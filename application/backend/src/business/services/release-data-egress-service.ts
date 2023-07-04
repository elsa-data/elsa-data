import * as edgedb from "edgedb";
import { AuthenticatedUser } from "../authenticated-user";
import { inject, injectable } from "tsyringe";
import { UserService } from "./user-service";
import { ReleaseBaseService } from "./release-base-service";
import { ElsaSettings } from "../../config/elsa-settings";
import { AuditEventService } from "./audit-event-service";
import { createPagedResult } from "../../api/helpers/pagination-helpers";

import {
  getReleaseDataEgress,
  getReleaseDataEgressSummary,
  releaseGetByReleaseKey,
} from "../../../dbschema/queries";
import { NotAuthorisedSyncDataEgressRecords } from "../exceptions/audit-authorisation";
import { AwsCloudTrailLakeService } from "./aws/aws-cloudtrail-lake-service";
import { AuditEventTimedService } from "./audit-event-timed-service";
import { LocationType } from "./ip-lookup-service";
import { CloudFormationClient } from "@aws-sdk/client-cloudformation";

/**
 * A service that coordinates the participation of users in a release
 * and what roles they play in that release.
 */
@injectable()
export class ReleaseDataEgressService extends ReleaseBaseService {
  constructor(
    @inject("Database") edgeDbClient: edgedb.Client,
    @inject("Settings") settings: ElsaSettings,
    @inject("Features") features: ReadonlySet<string>,
    @inject(AwsCloudTrailLakeService)
    private readonly awsCloudTrailLakeService: AwsCloudTrailLakeService,
    @inject(AuditEventService)
    auditEventService: AuditEventService,
    @inject("ReleaseAuditTimedService")
    auditEventTimedService: AuditEventTimedService,
    @inject(UserService) userService: UserService,
    @inject("CloudFormationClient") cfnClient: CloudFormationClient
  ) {
    super(
      settings,
      edgeDbClient,
      features,
      userService,
      auditEventService,
      auditEventTimedService,
      cfnClient
    );
  }

  private checkIsAllowedRefreshDatasetIndex(user: AuthenticatedUser): void {
    const isPermissionAllow = user.isAllowedRefreshDatasetIndex;
    if (isPermissionAllow) return;

    throw new NotAuthorisedSyncDataEgressRecords();
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

  public async getSummaryDataEgressByReleaseKey(
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
      dataEgressSummaryResult.data.map((v) => ({
        fileUrl: v.fileUrl ?? "",
        fileSize: v.fileSize ?? 0,
        totalDataEgressInBytes: v.totalDataEgressInBytes ?? 0,
        lastOccurredDateTime: v.lastOccurredDateTime,
      })),
      dataEgressSummaryResult.total
    );
  }

  public async getDataEgressRecordsByReleaseKey(
    user: AuthenticatedUser,
    releaseKey: string,
    limit: number,
    offset: number
  ) {
    const { userRole } = await this.getBoundaryInfoWithThrowOnFailure(
      user,
      releaseKey
    );

    const dataEgressQueryRes = await getReleaseDataEgress(this.edgeDbClient, {
      releaseKey,
      offset,
      limit,
    });

    return createPagedResult(
      dataEgressQueryRes.data.map((a) => ({
        ...a,
        sourceLocation: a.sourceLocation as LocationType,
      })),
      dataEgressQueryRes.total
    );
  }
}
