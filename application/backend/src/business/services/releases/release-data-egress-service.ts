import * as edgedb from "edgedb";
import { AuthenticatedUser } from "../../authenticated-user";
import { inject, injectable } from "tsyringe";
import { UserService } from "../user-service";
import { ReleaseBaseService } from "./release-base-service";
import { ElsaSettings } from "../../../config/elsa-settings";
import { AuditEventService } from "../audit-event-service";
import { createPagedResult } from "../../../api/helpers/pagination-helpers";

import {
  getReleaseDataEgress,
  getReleaseDataEgressSummary,
  releaseGetByReleaseKey,
  releaseLastUpdatedReset,
} from "../../../../dbschema/queries";
import { NotAuthorisedUpdateDataEgressRecords } from "../../exceptions/audit-authorisation";
import { AwsCloudTrailLakeService } from "../aws/aws-cloudtrail-lake-service";
import { AuditEventTimedService } from "../audit-event-timed-service";
import { IPLookupService, LocationType } from "../ip-lookup-service";
import { CloudFormationClient } from "@aws-sdk/client-cloudformation";
import { UserData } from "../../data/user-data";
import { updateDataEgressRecordByReleaseKey } from "./helpers/release-data-egress-helper";
import { PermissionService } from "../permission-service";

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
    @inject(PermissionService) permissionService: PermissionService,
    @inject("CloudFormationClient") cfnClient: CloudFormationClient,
    @inject(UserData) private readonly userData: UserData,
    @inject(IPLookupService) private readonly ipLookupService: IPLookupService,
  ) {
    super(
      settings,
      edgeDbClient,
      features,
      userService,
      auditEventService,
      auditEventTimedService,
      permissionService,
      cfnClient,
    );
  }

  private async checkIsAllowedRefreshDatasetIndex(
    user: AuthenticatedUser,
  ): Promise<void> {
    const dbUser = await this.userData.getDbUser(this.edgeDbClient, user);

    if (!dbUser.isAllowedRefreshDatasetIndex)
      throw new NotAuthorisedUpdateDataEgressRecords();
  }

  public async updateDataEgressRecordsByReleaseKey(
    user: AuthenticatedUser,
    releaseKey: string,
  ) {
    await this.checkIsAllowedRefreshDatasetIndex(user);

    const datasetUrisArray = (
      await releaseGetByReleaseKey(this.edgeDbClient, {
        releaseKey,
      })
    )?.datasetUris;

    await this.auditEventService.transactionalUpdateInReleaseAuditPattern(
      user,
      releaseKey,
      `Update data egress records: ${releaseKey}`,
      async () => {
        await this.checkIsAllowedRefreshDatasetIndex(user);
      },

      async (tx, a) => {
        if (!datasetUrisArray) throw new Error("No dataset found!");
        await updateDataEgressRecordByReleaseKey({
          tx: tx,
          dataEgressQueryService: this.awsCloudTrailLakeService,
          ipLookupService: this.ipLookupService,
          releaseKey: releaseKey,
        });

        await releaseLastUpdatedReset(tx, {
          releaseKey: releaseKey,
          lastUpdatedSubjectId: user.subjectId,
        });
      },
      async () => {},
    );
  }

  public async getSummaryDataEgressByReleaseKey(
    user: AuthenticatedUser,
    releaseKey: string,
    limit: number,
    offset: number,
  ) {
    const { userRole } = await this.getBoundaryInfoWithThrowOnFailure(
      user,
      releaseKey,
    );

    const dataEgressSummaryResult = await getReleaseDataEgressSummary(
      this.edgeDbClient,
      {
        releaseKey,
        offset,
        limit,
      },
    );

    return createPagedResult(
      dataEgressSummaryResult.data.map((v) => ({
        fileUrl: v.fileUrl ?? "",
        fileSize: v.fileSize ?? 0,
        totalDataEgressInBytes: v.totalDataEgressInBytes ?? 0,
        lastOccurredDateTime: v.lastOccurredDateTime,
        isActive: v.isActive,
      })),
      dataEgressSummaryResult.total,
    );
  }

  public async getDataEgressRecordsByReleaseKey(
    user: AuthenticatedUser,
    releaseKey: string,
    limit: number,
    offset: number,
  ) {
    const { userRole } = await this.getBoundaryInfoWithThrowOnFailure(
      user,
      releaseKey,
    );

    const dataEgressQueryRes = await getReleaseDataEgress(this.edgeDbClient, {
      releaseKey,
      offset,
      limit,
    });

    return createPagedResult(
      dataEgressQueryRes.data.map((a) => ({
        ...a,
        sourceLocation: a.sourceLocation as LocationType | null,
      })),
      dataEgressQueryRes.total,
    );
  }
}
