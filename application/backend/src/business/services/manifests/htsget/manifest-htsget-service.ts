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
  ManifestHtsgetNotConfigured,
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
import { ReleaseService } from "../../releases/release-service";
import { ManifestHtsgetTsvType } from "../manifest-bucket-key-types";
import { PermissionService } from "../../permission-service";
import { ObjectStoreRecordKey } from "@umccr/elsa-types";
import { getFirstExternalIds } from "../manifest-tsv-helper";
import { decomposeUrl } from "../../_release-file-list-helper";
import { createTsv } from "../manifest-master-helper";

export function getHtsgetSetting(
  settings: ElsaSettings,
): SharerHtsgetType | undefined {
  // the typescript is not clever enough to work out the resolution of the discriminated union
  // to our htsget type - so we need to typecast
  const htsgetSettings: SharerHtsgetType[] = settings.sharers.filter(
    (s) => s.type === "htsget",
  ) as SharerHtsgetType[];

  if (htsgetSettings.length < 1) {
    return undefined;
  }

  if (htsgetSettings.length > 1)
    throw new Error(
      "For the moment we have only enabled the logic for a single htsget sharer",
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
    private readonly releaseService: ReleaseService,
    private readonly permissionService: PermissionService,
  ) {}

  public async getActiveHtsgetManifest(
    releaseKey: string,
  ): Promise<ManifestHtsgetType | null> {
    const masterManifest =
      await this.manifestService.getActiveManifest(releaseKey);

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
   * @param header
   */
  public async getActiveHtsgetManifestAsTsv(
    user: AuthenticatedUser,
    releaseKey: string,
    header: (typeof ObjectStoreRecordKey)[number][],
  ) {
    const { userRole, isActivated } =
      await this.releaseService.getBoundaryInfoWithThrowOnFailure(
        user,
        releaseKey,
      );

    if (!this.permissionService.canAccessData(userRole))
      throw new ReleaseViewError(releaseKey);

    if (!isActivated) throw new Error("needs to be activated");

    const htsgetManifest = await this.getActiveHtsgetManifest(releaseKey);

    if (!htsgetManifest) throw new Error("needs an active htsget manifest");

    const now = new Date();
    const newAuditEventId = await this.auditLogService.startReleaseAuditEvent(
      user,
      releaseKey,
      "E",
      "Created htsget TSV",
      now,
      this.edgeDbClient,
    );

    try {
      const tsv = await createTsv(header, async () => {
        const variants = await this.createHtsgetTsvForEndpoint(
          releaseKey,
          htsgetManifest,
          "variants",
        );
        const reads = await this.createHtsgetTsvForEndpoint(
          releaseKey,
          htsgetManifest,
          "reads",
        );

        if (variants === null || reads == null) {
          return null;
        }

        return variants.concat(reads);
      });

      await this.auditLogService.completeReleaseAuditEvent(
        newAuditEventId,
        0,
        now,
        new Date(),
        { header },
        this.edgeDbClient,
      );

      const counter = await this.releaseService.getIncrementingCounter(
        user,
        releaseKey,
      );

      const filename = `release-${releaseKey.replaceAll(
        "-",
        "",
      )}-htsget-${counter}.tsv`;

      return {
        filename: filename,
        content: tsv,
      };
    } catch (e) {
      const errorString = e instanceof Error ? e.message : String(e);

      await this.auditLogService.completeReleaseAuditEvent(
        newAuditEventId,
        8,
        now,
        new Date(),
        {
          error: errorString,
          header,
        },
        this.edgeDbClient,
      );

      throw e;
    }
  }

  /**
   * Create a new htsget TSV.
   *
   * @param releaseKey release key.
   * @param htsgetManifest main htsget manifest.
   * @param endpoint endpoint to create manifest for.
   */
  async createHtsgetTsvForEndpoint(
    releaseKey: string,
    htsgetManifest: ManifestHtsgetType,
    endpoint: "reads" | "variants",
  ): Promise<ManifestHtsgetTsvType[] | null> {
    const htsgetUrl = this.releaseService.configForFeature("isAllowedHtsget");
    if (!htsgetUrl) {
      throw new ManifestHtsgetNotConfigured();
    }

    const tsvObjects: ManifestHtsgetTsvType[] = [];

    const manifest = await this.manifestService.getActiveManifest(releaseKey);
    if (!manifest) {
      return null;
    }

    const pushTsvObject = (
      ids: any,
      key: string,
      decomposed: any,
      url: string,
    ) => {
      tsvObjects.push({
        caseId: ids.caseId,
        patientId: ids.patientId,
        specimenId: ids.specimenId,
        artifactId: key,
        objectStoreUrl: url,
        // Only VCF and BAM for now.
        objectType: endpoint === "variants" ? "VCF" : "BAM",
        objectStoreKey: decomposed.key,
        objectStoreName: decomposed.baseName,
        objectStoreBucket: decomposed.bucket,
        objectStoreProtocol: "htsget",
        // MD5 and size not known prior to htsget request. The signed URL is also unused.
      });
    };

    for (const [key, data] of Object.entries(
      endpoint === "variants"
        ? htsgetManifest.variants
        : htsgetManifest.reads ?? {},
    )) {
      // There should not be a case where there is a key in the htsgetManifest but not in the normal manifest.
      const entry = manifest.specimenList.find((entry) => entry.id === key)!;

      const ids = getFirstExternalIds(entry);
      const decomposed = decomposeUrl(data.url);

      htsgetUrl.pathname = `/${endpoint}/${releaseKey}/${key}`;

      // If there are no restrictions, just add the whole url.
      if (data.restrictions.length === 0) {
        pushTsvObject(ids, key, decomposed, htsgetUrl.toString());
      }

      // Each restriction should have another htsget url associated with it.
      for (const restriction of data.restrictions) {
        htsgetUrl.searchParams.set(
          "referenceName",
          restriction.chromosome.toString(),
        );

        if (restriction.start) {
          htsgetUrl.searchParams.set("start", restriction.start.toString());
        }
        if (restriction.end) {
          htsgetUrl.searchParams.set("end", restriction.end.toString());
        }

        pushTsvObject(ids, key, decomposed, htsgetUrl.toString());
      }
    }

    return tsvObjects;
  }

  async publishHtsgetManifestAuditFn(
    releaseKey: string,
    completeAuditFn: (details: any, executor: Executor) => Promise<void>,
  ): Promise<ManifestHtsgetResponseType> {
    const activated = await releaseIsActivated(this.edgeDbClient, {
      releaseKey,
    });
    const htsgetSharingConfig = await releaseDataSharingConfigurationGetHtsget(
      this.edgeDbClient,
      {
        releaseKey,
      },
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
        manifestKey,
      );

      this.logger.debug(
        `received head object in htsget manifest route: ${JSON.stringify(
          head,
        )}`,
      );

      // Get the difference in time between now and the last modified date of the object, plus it's max age.
      if (head.lastModified !== undefined) {
        const addMaxAge = addSeconds(
          head.lastModified,
          htsgetSettings.maxAgeInSeconds,
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
        }`,
      );

      await this.cloudStorage.put(
        this.settings.aws.tempBucket,
        manifestKey,
        JSON.stringify(manifest),
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
    releaseKey: string,
  ): Promise<ManifestHtsgetResponseType> {
    return await this.auditLogService.systemAuditEventPattern(
      "publish htsget manifest",
      async (completeAuditFn) => {
        return await this.publishHtsgetManifestAuditFn(
          releaseKey,
          completeAuditFn,
        );
      },
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
    @inject(ReleaseService) releaseService: ReleaseService,
    @inject(PermissionService) permissionService: PermissionService,
  ) {
    super(
      settings,
      edgeDbClient,
      logger,
      awsS3Service,
      auditLogService,
      manifestService,
      releaseService,
      permissionService,
    );
  }
}
