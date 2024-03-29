import * as edgedb from "edgedb";
import { AuthenticatedUser } from "../../authenticated-user";
import { getReleaseInfo } from "../helpers";
import { inject, injectable } from "tsyringe";
import { UserService } from "../user-service";
import { ReleaseBaseService } from "./release-base-service";
import { ElsaSettings } from "../../../config/elsa-settings";
import e from "../../../../dbschema/edgeql-js";
import { AuditEventService } from "../audit-event-service";
import { ReleaseDisappearedError } from "../../exceptions/release-disappear";
import {
  ReleaseActivatedNothingError,
  ReleaseActivationPermissionError,
  ReleaseActivationStateError,
  ReleaseDeactivationRunningJobError,
  ReleaseDeactivationStateError,
} from "../../exceptions/release-activation";
import etag from "etag";
import { Logger } from "pino";
import { ManifestService } from "../manifests/manifest-service";
import { AuditEventTimedService } from "../audit-event-timed-service";
import { CloudFormationClient } from "@aws-sdk/client-cloudformation";
import { EmailService } from "../email-service";
import { ReleaseParticipationService } from "./release-participation-service";
import { PermissionService } from "../permission-service";
import { JobCloudFormationDeleteService } from "../jobs/job-cloud-formation-delete-service";

/**
 * A service that handles activated and deactivating releases.
 */
@injectable()
export class ReleaseActivationService extends ReleaseBaseService {
  constructor(
    @inject("Database") edgeDbClient: edgedb.Client,
    @inject("Settings") settings: ElsaSettings,
    @inject("Features") features: ReadonlySet<string>,
    @inject("Logger") private readonly logger: Logger,
    @inject(AuditEventService)
    auditEventService: AuditEventService,
    @inject("ReleaseAuditTimedService")
    auditEventTimedService: AuditEventTimedService,
    @inject(ManifestService) private readonly manifestService: ManifestService,
    @inject(UserService) userService: UserService,
    @inject(PermissionService) permissionService: PermissionService,
    @inject("CloudFormationClient") cfnClient: CloudFormationClient,
    @inject(EmailService) private readonly emailService: EmailService,
    @inject(ReleaseParticipationService)
    private readonly releaseParticipationService: ReleaseParticipationService,
    @inject(JobCloudFormationDeleteService)
    private readonly jobCloudFormationDeleteService: JobCloudFormationDeleteService,
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

  /**
   * Emails all participants when the release is activated or deactivated.
   * @param user
   * @param releaseKey
   * @param template
   */
  public async emailAllParticipants(
    user: AuthenticatedUser,
    releaseKey: string,
    template: string,
  ) {
    // I think emails should not be part of the activation/deactivation transaction, but I could be wrong.
    const participants = await this.releaseParticipationService.getParticipants(
      user,
      releaseKey,
    );

    if (participants.data !== undefined) {
      await Promise.all(
        participants.data.map(async (participant) => {
          await this.emailService.sendEmailTemplate(
            template,
            participant.email,
            {
              releaseKey,
              name: participant.displayName ?? "",
              fromName: this.settings.emailer?.from.name ?? "",
            },
          );
        }),
      );
    }
  }

  /**
   * For the current state of a release, 'activate' it which means to switch
   * on all necessary flags that enable actual data sharing, create and save
   * a point-in-time snapshot of what is being shared (the master manifest).
   *
   * @param user
   * @param releaseKey
   * @protected
   */
  public async activateRelease(user: AuthenticatedUser, releaseKey: string) {
    const { userRole } = await this.getBoundaryInfoWithThrowOnFailure(
      user,
      releaseKey,
    );

    await this.auditEventService.transactionalUpdateInReleaseAuditPattern(
      user,
      releaseKey,
      "Activated Release",
      async () => {
        if (userRole !== "Administrator") {
          throw new ReleaseActivationPermissionError(releaseKey);
        }
      },
      async (tx, _) => {
        const { releaseInfo } = await getReleaseInfo(tx, releaseKey);

        if (!releaseInfo) throw new ReleaseDisappearedError(releaseKey);

        // importantly for this service we need to delay checking
        // the activation status until we get inside the transaction
        if (releaseInfo.activation)
          throw new ReleaseActivationStateError(releaseKey);

        // Do some checking if release is activatable
        // 1. Check if there are any sharing configuration allowed for the release
        // 2. Check if there are cases releasable with the specified cases and access control
        //    are check within the 'createMasterManifest' function
        if (
          !releaseInfo.dataSharingConfiguration.objectSigningEnabled &&
          !releaseInfo.dataSharingConfiguration.copyOutEnabled &&
          !releaseInfo.dataSharingConfiguration.htsgetEnabled &&
          !releaseInfo.dataSharingConfiguration.awsAccessPointEnabled &&
          !releaseInfo.dataSharingConfiguration.gcpStorageIamEnabled
        ) {
          throw new ReleaseActivatedNothingError(
            "No sharing configuration is enabled",
          );
        }

        const m = await this.manifestService.createMasterManifest(
          tx,
          releaseKey,
        );

        // once this is working well we can probably drop this to debug
        this.logger.info(m, "created release master manifest");

        // collect some basic info that _might_ be useful in an audit log
        const specimensConstructed = (m.specimenList ?? []).length;
        const artifactsConstructed = (m.specimenList ?? []).reduce(
          (partialSum, a) => partialSum + (a.artifacts ?? []).length,
          0,
        );
        const casesConstructed = (m.caseTree ?? []).length;

        // the etag is going to be useful for HTTP caching/fetches
        const et = etag(JSON.stringify(m));
        await e
          .update(e.release.Release, (r) => ({
            filter: e.op(r.releaseKey, "=", releaseKey),
            set: {
              activation: e.insert(e.release.Activation, {
                activatedById: user.subjectId,
                activatedByDisplayName: user.displayName,
                manifest: e.json(m),
                manifestEtag: et,
              }),
            },
          }))
          .run(tx);

        return {
          manifestEtag: et,
          manifestSpecimens: specimensConstructed,
          manifestArtifacts: artifactsConstructed,
          manifestCases: casesConstructed,
        };
      },
      async (_) => {},
    );

    await this.emailAllParticipants(
      user,
      releaseKey,
      "release/release-activated",
    );
  }

  /**
   * Deactivate an activated release - meaning the release becomes open to editing
   * again, and the previous activation goes into a history of activations.
   *
   * @param user
   * @param releaseKey
   */
  public async deactivateRelease(user: AuthenticatedUser, releaseKey: string) {
    const { userRole, isRunningJob } =
      await this.getBoundaryInfoWithThrowOnFailure(user, releaseKey);

    await this.auditEventService.transactionalUpdateInReleaseAuditPattern(
      user,
      releaseKey,
      "Deactivated release",
      async () => {
        if (userRole !== "Administrator") {
          throw new ReleaseActivationPermissionError(releaseKey);
        }
      },
      async (tx, _) => {
        const { releaseInfo } = await getReleaseInfo(tx, releaseKey);

        if (!releaseInfo) throw new ReleaseDisappearedError(releaseKey);

        // Not allowing to deactivate release while there is an existing running job
        if (isRunningJob)
          throw new ReleaseDeactivationRunningJobError(releaseKey);

        // importantly for this service we need to delay checking
        // the activation status until we get inside the transaction
        if (!releaseInfo.activation)
          throw new ReleaseDeactivationStateError(releaseKey);

        {
          // If release is deactivated, all access that was given should be revoked (e.g. AccessPoint)
          // Might refactor this out to its own function as things to revoke grows
          const isAllowedAwsAccessPointConfig =
            this.configForAwsAccessPointFeature();

          const dataSharingAwsAccessPoint = isAllowedAwsAccessPointConfig
            ? await this.getAwsAccessPointDetail(
                isAllowedAwsAccessPointConfig,
                releaseKey,
                releaseInfo.dataSharingConfiguration.awsAccessPointName,
              )
            : undefined;
          if (dataSharingAwsAccessPoint?.installed) {
            await this.jobCloudFormationDeleteService.startCloudFormationDeleteJob(
              user,
              releaseKey,
            );
          }
        }

        await e
          .update(e.release.Release, (r) => ({
            filter: e.op(r.releaseKey, "=", releaseKey),
            set: {
              previouslyActivated: { "+=": r.activation },
              activation: null,
            },
          }))
          .run(tx);
      },
      async (_) => {},
    );

    await this.emailAllParticipants(
      user,
      releaseKey,
      "release/release-deactivated",
    );
  }
}
