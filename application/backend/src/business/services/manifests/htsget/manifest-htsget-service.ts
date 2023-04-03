import * as edgedb from "edgedb";
import { Executor } from "edgedb";
import {
  ManifestHtsgetResponseType,
  ManifestHtsgetType,
} from "./manifest-htsget-types";
import {
  releaseIsActivated,
  releaseIsAllowedHtsget,
} from "../../../../../dbschema/queries";
import {
  ManifestHtsgetEndpointNotEnabled,
  ManifestHtsgetError,
  ManifestHtsgetNotAllowed,
} from "../../../exceptions/manifest-htsget";
import { add, isPast } from "date-fns";
import { NotFound } from "@aws-sdk/client-s3";
import { transformMasterManifestToHtsgetManifest } from "./manifest-htsget-helper";
import { inject, injectable } from "tsyringe";
import { ElsaSettings } from "../../../../config/elsa-settings";
import { Logger } from "pino";
import { CloudStorage } from "../../cloud-storage-service";
import { AuditLogService } from "../../audit-log-service";
import { ManifestService } from "../manifest-service";
import { AwsS3Service } from "../../aws/aws-s3-service";

/**
 * A manifest service for htsget.
 */
export abstract class ManifestHtsgetService {
  private static readonly HTSGET_MANIFESTS_FOLDER = "htsget-manifests";

  protected constructor(
    @inject("Settings") private readonly settings: ElsaSettings,
    @inject("Database") private readonly edgeDbClient: edgedb.Client,
    @inject("Logger") private logger: Logger,
    private readonly cloudStorage: CloudStorage,
    private readonly auditLogService: AuditLogService,
    private readonly manifestService: ManifestService
  ) {}

  public async getActiveHtsgetManifest(
    releaseKey: string
  ): Promise<ManifestHtsgetType | null> {
    const masterManifest = await this.manifestService.getActiveManifest(
      releaseKey
    );

    // TODO fix exceptions here
    if (!masterManifest) return null;

    return transformMasterManifestToHtsgetManifest(masterManifest);
  }

  async publishHtsgetManifestAuditFn(
    releaseKey: string,
    completeAuditFn: (executor: Executor, details: any) => Promise<void>
  ): Promise<ManifestHtsgetResponseType> {
    const activated = await releaseIsActivated(this.edgeDbClient, {
      releaseKey,
    });
    const allowed = await releaseIsAllowedHtsget(this.edgeDbClient, {
      releaseKey,
    });

    if (!activated?.isActivated || !allowed?.isAllowedHtsget) {
      throw new ManifestHtsgetNotAllowed();
    }

    if (this.settings.htsget === undefined || this.settings.aws === undefined) {
      throw new ManifestHtsgetEndpointNotEnabled();
    }

    let shouldUpdate = false;
    try {
      // Should htsget have its own bucket, or is the tempBucket okay?
      const head = await this.cloudStorage.head(
        this.settings.aws.tempBucket,
        releaseKey
      );

      this.logger.debug(
        `received head object in htsget manifest route: ${head}`
      );

      shouldUpdate =
        head.lastModified === undefined ||
        isPast(add(head.lastModified, this.settings.htsget.manifestTTL));
    } catch (error) {
      if (error instanceof NotFound) {
        shouldUpdate = true;
      } else {
        throw error;
      }
    }

    if (shouldUpdate) {
      const manifest = await this.getActiveHtsgetManifest(releaseKey);

      if (manifest === null) {
        throw new ManifestHtsgetError();
      }

      this.logger.debug(
        `publishing manifest: ${manifest} to bucket: ${this.settings.aws.tempBucket}`
      );

      await this.cloudStorage.put(
        this.settings.aws.tempBucket,
        `${ManifestHtsgetService.HTSGET_MANIFESTS_FOLDER}/${releaseKey}`,
        manifest.toString()
      );
    }

    const output = {
      location: {
        bucket: this.settings.aws.tempBucket,
        key: releaseKey,
      },
      cached: !shouldUpdate,
    };

    await completeAuditFn(this.edgeDbClient, output);

    this.logger.debug(`published manifest with output: ${output}`);

    return output;
  }

  public async publishHtsgetManifest(
    releaseKey: string
  ): Promise<ManifestHtsgetResponseType> {
    return await this.auditLogService.systemAuditEventPattern(
      "publish htsget manifest",
      async (completeAuditFn) => {
        return await this.publishHtsgetManifestAuditFn(
          releaseKey,
          completeAuditFn
        );
      }
    );
  }
}

/**
 * Used so that we can register different implementations of cloud storage.
 */
@injectable()
export class S3ManifestHtsgetService extends ManifestHtsgetService {
  constructor(
    @inject("Settings") settings: ElsaSettings,
    @inject("Database") edgeDbClient: edgedb.Client,
    @inject("Logger") logger: Logger,
    awsS3Service: AwsS3Service,
    auditLogService: AuditLogService,
    manifestService: ManifestService
  ) {
    super(
      settings,
      edgeDbClient,
      logger,
      awsS3Service,
      auditLogService,
      manifestService
    );
  }
}
