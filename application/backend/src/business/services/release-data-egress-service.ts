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
import { NotAuthorisedUpdateDataEgressRecords } from "../exceptions/audit-authorisation";
import { AwsCloudTrailLakeService } from "./aws/aws-cloudtrail-lake-service";
import { AuditEventTimedService } from "./audit-event-timed-service";
import { LocationType } from "./ip-lookup-service";

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
    @inject(UserService) userService: UserService
  ) {
    super(
      settings,
      edgeDbClient,
      features,
      userService,
      auditEventService,
      auditEventTimedService
    );
  }

  public async updateDataEgressRecordByReleaseKey(
    user: AuthenticatedUser,
    releaseKey: string
  ) {
    const { userRole } = await this.getBoundaryInfoWithThrowOnFailure(
      user,
      releaseKey
    );
    const datasetUrisArray = (
      await releaseGetByReleaseKey(this.edgeDbClient, {
        releaseKey,
      })
    )?.datasetUris;

    await this.auditEventService.transactionalUpdateInReleaseAuditPattern(
      user,
      releaseKey,
      "update the latest data egress records available",
      async () => {
        if (!user.isAllowedRefreshDatasetIndex)
          throw new NotAuthorisedUpdateDataEgressRecords();
      },
      async (tx, a) => {
        if (!datasetUrisArray) throw new Error("No dataset found!");
        await this.awsCloudTrailLakeService.fetchCloudTrailLakeLog({
          user,
          releaseKey,
          datasetUrisArray,
        });
      },
      async () => {}
    );
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
