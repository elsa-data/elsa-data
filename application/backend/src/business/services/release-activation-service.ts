import * as edgedb from "edgedb";
import { AuthenticatedUser } from "../authenticated-user";
import { getReleaseInfo } from "./helpers";
import { inject, injectable } from "tsyringe";
import { UsersService } from "./users-service";
import { ReleaseBaseService } from "./release-base-service";
import { ElsaSettings } from "../../config/elsa-settings";
import e from "../../../dbschema/edgeql-js";
import { AuditLogService } from "./audit-log-service";
import { ReleaseDisappearedError } from "../exceptions/release-disappear";
import {
  ReleaseActivationPermissionError,
  ReleaseActivationStateError,
  ReleaseDeactivationStateError,
} from "../exceptions/release-activation";
import { createReleaseManifest } from "./manifests/_manifest-helper";
import etag from "etag";
import { Logger } from "pino";
import { ManifestService } from "./manifests/manifest-service";

/**
 * A service that handles activated and deactivating releases.
 */
@injectable()
export class ReleaseActivationService extends ReleaseBaseService {
  constructor(
    @inject("Database") edgeDbClient: edgedb.Client,
    @inject("Settings") private settings: ElsaSettings,
    @inject("Logger") private logger: Logger,
    private auditLogService: AuditLogService,
    private manifestService: ManifestService,
    usersService: UsersService
  ) {
    super(edgeDbClient, usersService);
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
      releaseKey
    );

    return this.auditLogService.transactionalUpdateInReleaseAuditPattern(
      user,
      releaseKey,
      "Activated Release",
      async () => {
        if (userRole !== "DataOwner") {
          throw new ReleaseActivationPermissionError(releaseKey);
        }
      },
      async (tx, a) => {
        const { releaseInfo } = await getReleaseInfo(tx, releaseKey);

        if (!releaseInfo) throw new ReleaseDisappearedError(releaseKey);

        // importantly for this service we need to delay checking
        // the activation status until we get inside the transaction
        if (releaseInfo.activation)
          throw new ReleaseActivationStateError(releaseKey);

        const m = await this.manifestService.createMasterManifest(
          tx,
          releaseKey,
          releaseInfo.isAllowedReadData,
          releaseInfo.isAllowedVariantData,
          releaseInfo.isAllowedS3Data,
          releaseInfo.isAllowedGSData,
          releaseInfo.isAllowedR2Data
        );

        // once this is working well we can probably drop this to debug
        this.logger.info(m, "created release master manifest");

        // collect some basic info that _might_ be useful in an audit log
        const specimensConstructed = (m.specimenList ?? []).length;
        const artifactsConstructed = (m.specimenList ?? []).reduce(
          (partialSum, a) => partialSum + (a.artifacts ?? []).length,
          0
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
      async (a) => {}
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
    const { userRole } = await this.getBoundaryInfoWithThrowOnFailure(
      user,
      releaseKey
    );

    return this.auditLogService.transactionalUpdateInReleaseAuditPattern(
      user,
      releaseKey,
      "Deactivated release",
      async () => {
        if (userRole !== "DataOwner") {
          throw new ReleaseActivationPermissionError(releaseKey);
        }
      },
      async (tx, a) => {
        const { releaseInfo } = await getReleaseInfo(tx, releaseKey);

        if (!releaseInfo) throw new ReleaseDisappearedError(releaseKey);

        // importantly for this service we need to delay checking
        // the activation status until we get inside the transaction
        if (!releaseInfo.activation)
          throw new ReleaseDeactivationStateError(releaseKey);

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
      async (a) => {}
    );
  }
}
