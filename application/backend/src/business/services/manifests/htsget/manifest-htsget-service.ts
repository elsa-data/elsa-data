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
import { AuditEventService } from "../../audit-event-service";
import { ManifestService } from "../manifest-service";
import { AwsS3Service } from "../../aws/aws-s3-service";
import { SharerHtsgetType } from "../../../../config/config-schema-sharer";
import { AuthenticatedUser } from "../../../authenticated-user";
import { ReleaseViewError } from "../../../exceptions/release-authorisation";
import assert from "assert";
import { stringify } from "csv-stringify";
import { Readable } from "stream";
import streamConsumers from "node:stream/consumers";
import { ReleaseService } from "../../releases/release-service";
import { ManifestBucketKeyObjectType } from "../manifest-bucket-key-types";

export function getHtsgetSetting(
  settings: ElsaSettings
): SharerHtsgetType | undefined {
  // the typescript is not clever enough to work out the resolution of the discriminated union
  // to our htsget type - so we need to typecast
  const htsgetSettings: SharerHtsgetType[] = settings.sharers.filter(
    (s) => s.type === "htsget"
  ) as SharerHtsgetType[];

  if (htsgetSettings.length < 1) {
    return undefined;
  }

  if (htsgetSettings.length > 1)
    throw new Error(
      "For the moment we have only enabled the logic for a single htsget sharer"
    );

  return htsgetSettings[0];
}

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
    private readonly auditLogService: AuditEventService,
    private readonly manifestService: ManifestService,
    private readonly releaseService: ReleaseService
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

  /**
   * Get the active htsget manifest but converted to a simple TSV
   * with htsget URLs etc. This is for presentation to the
   * researcher.
   *
   * @param user
   * @param releaseKey
   * @param tsvColumns
   */
  public async getActiveHtsgetManifestAsTsv(
    user: AuthenticatedUser,
    releaseKey: string,
    tsvColumns: string[]
  ) {
    const { userRole, isActivated } =
      await this.releaseService.getBoundaryInfoWithThrowOnFailure(
        user,
        releaseKey
      );

    if (!(userRole === "Manager" || userRole === "Member")) {
      throw new ReleaseViewError(releaseKey);
    }

    if (!isActivated) throw new Error("needs to be activated");

    const htsgetManifest = await this.getActiveHtsgetManifest(releaseKey);

    if (!htsgetManifest) throw new Error("needs an active htsget manifest");

    const tsvObjects: ManifestBucketKeyObjectType[] = [];

    // TODO - better filling in of the TSV objects structure
    //        might need cross referencing from the master manifest etc

    for (const [key, r] of Object.entries(htsgetManifest.reads ?? {})) {
      tsvObjects.push({
        caseId: "CASE",
        patientId: "PATIENT",
        specimenId: "SPECIMEN",
        artifactId: key,
        // FIX
        objectStoreUrl: `htsget://${"host"}/reads/${key}`,
        objectType: "BAM",
        objectStoreSigned: "",
        objectStoreKey: "",
        objectStoreBucket: "",
        objectStoreProtocol: "htsget",
        objectSize: 0,
      });
    }

    // setup a TSV stream
    const stringifyColumnOptions = [];

    for (const header of tsvColumns) {
      stringifyColumnOptions.push({
        key: header,
        header: header.toUpperCase(),
      });
    }
    const stringifier = stringify({
      header: true,
      columns: stringifyColumnOptions,
      delimiter: "\t",
    });

    const readableStream = Readable.from(tsvObjects);
    const buf = await streamConsumers.text(readableStream.pipe(stringifier));

    const counter = await this.releaseService.getIncrementingCounter(
      user,
      releaseKey
    );

    const filename = `release-${releaseKey.replaceAll(
      "-",
      ""
    )}-htsget-${counter}.tsv`;

    return {
      filename: filename,
      content: buf,
    };
  }

  async publishHtsgetManifestAuditFn(
    releaseKey: string,
    completeAuditFn: (details: any, executor: Executor) => Promise<void>
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

    if (!this.settings.aws) throw new ManifestHtsgetEndpointNotEnabled();

    const htsgetSettings = getHtsgetSetting(this.settings);

    if (!htsgetSettings) throw new ManifestHtsgetEndpointNotEnabled();

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
          htsgetSettings.maxAgeInSeconds
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

    if (
      timeDifference <= 0 ||
      timeDifference > htsgetSettings.maxAgeInSeconds
    ) {
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

      timeDifference = htsgetSettings.maxAgeInSeconds;
    }

    const output = {
      location: {
        bucket: this.settings.aws.tempBucket,
        key: manifestKey,
      },
      maxAge: timeDifference,
    };

    await completeAuditFn(output, this.edgeDbClient);

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
    @inject(AuditEventService) auditLogService: AuditEventService,
    @inject(ManifestService) manifestService: ManifestService,
    @inject(ReleaseService) releaseService: ReleaseService
  ) {
    super(
      settings,
      edgeDbClient,
      logger,
      awsS3Service,
      auditLogService,
      manifestService,
      releaseService
    );
  }
}
