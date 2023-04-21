import * as edgedb from "edgedb";
import { Executor } from "edgedb";
import {
  ManifestHtsgetResponseType,
  ManifestHtsgetType,
} from "./manifest-htsget-types";
import {
  releaseDataSharingConfigurationGetHtsget,
  releaseIsActivated,
} from "../../../../../dbschema/queries";
import {
  ManifestHtsgetEndpointNotEnabled,
  ManifestHtsgetError,
  ManifestHtsgetNotAllowed,
} from "../../../exceptions/manifest-htsget";
import { addSeconds, differenceInSeconds } from "date-fns";
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
    private readonly settings: ElsaSettings,
    private readonly edgeDbClient: edgedb.Client,
    private readonly logger: Logger,
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
    const htsgetSharingConfig = await releaseDataSharingConfigurationGetHtsget(
      this.edgeDbClient,
      {
        releaseKey,
      }
    );

    if (!activated?.isActivated || !htsgetSharingConfig?.htsgetEnabled) {
      throw new ManifestHtsgetNotAllowed();
    }

    if (this.settings.htsget === undefined || this.settings.aws === undefined) {
      throw new ManifestHtsgetEndpointNotEnabled();
    }

    const manifestKey = `${ManifestHtsgetService.HTSGET_MANIFESTS_FOLDER}/${releaseKey}`;

    let timeDifference = 0;
    try {
      // Should htsget have its own bucket, or is the tempBucket okay?
      const head = await this.cloudStorage.head(
        this.settings.aws.tempBucket,
        manifestKey
      );

      this.logger.debug(
        `received head object in htsget manifest route: ${JSON.stringify(head)}`
      );

      // Get the difference in time between now and the last modified date of the object, plus it's max age.
      if (head.lastModified !== undefined) {
        const addMaxAge = addSeconds(
          head.lastModified,
          this.settings.htsget.maxAge
        );
        timeDifference = differenceInSeconds(addMaxAge, new Date());
      }
    } catch (error) {
      if (error instanceof NotFound) {
        this.logger.debug("manifest object not found");
        // Do nothing
      } else {
        throw error;
      }
    }

    if (timeDifference <= 0 || timeDifference > this.settings.htsget.maxAge) {
      const manifest = await this.getActiveHtsgetManifest(releaseKey);

      if (manifest === null) {
        throw new ManifestHtsgetError();
      }

      this.logger.debug(
        `publishing manifest: ${JSON.stringify(manifest)} to bucket: ${
          this.settings.aws.tempBucket
        }`
      );

      await this.cloudStorage.put(
        this.settings.aws.tempBucket,
        manifestKey,
        JSON.stringify(manifest)
      );

      timeDifference = this.settings.htsget.maxAge;
    }

    const output = {
      location: {
        bucket: this.settings.aws.tempBucket,
        key: manifestKey,
      },
      maxAge: timeDifference,
    };

    await completeAuditFn(this.edgeDbClient, output);

    this.logger.debug(`htsget manifest with output: ${JSON.stringify(output)}`);

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
    @inject(AwsS3Service) awsS3Service: AwsS3Service,
    @inject(AuditLogService) auditLogService: AuditLogService,
    @inject(ManifestService) manifestService: ManifestService
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
