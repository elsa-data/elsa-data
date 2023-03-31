import { inject, injectable } from "tsyringe";
import e from "../../../../dbschema/edgeql-js";
import * as edgedb from "edgedb";
import { Executor } from "edgedb";
import {
  releaseGetSpecimenTreeAndFileArtifacts,
  releaseIsActivated,
  releaseIsAllowedHtsget,
} from "../../../../dbschema/queries";
import { ManifestMasterType } from "./manifest-master-types";
import { transformDbManifestToMasterManifest } from "./manifest-master-helper";
import { transformMasterManifestToHtsgetManifest } from "./htsget/manifest-htsget-helper";
import {
  ManifestHtsgetResponseType,
  ManifestHtsgetType,
} from "./htsget/manifest-htsget-types";
import { transformMasterManifestToBucketKeyManifest } from "./manifest-bucket-key-helper";
import { ManifestBucketKeyType } from "./manifest-bucket-key-types";
import {
  CloudStorageFactory,
  CloudStorageType,
} from "../cloud-storage-service";
import { ElsaSettings } from "../../../config/elsa-settings";
import { NotFound } from "@aws-sdk/client-s3";
import { add, isPast } from "date-fns";
import {
  HtsgetNotAllowed,
  ManifestHtsgetEndpointNotEnabled,
  ManifestHtsgetError,
  ManifestHtsgetStorageNotEnabled,
} from "../../exceptions/manifest-htsget";
import { AuditLogService } from "../audit-log-service";

@injectable()
export class ManifestService {
  private static readonly HTSGET_MANIFESTS_FOLDER = "htsget-manifests";

  constructor(
    @inject("Settings") private readonly settings: ElsaSettings,
    @inject("Database") private readonly edgeDbClient: edgedb.Client,
    private readonly cloudStorageFactory: CloudStorageFactory,
    private readonly auditLogService: AuditLogService
  ) {}

  /**
   * Return the manifest for this release if present, else return null.
   *
   * NOTE: this has no User on this call because we haven't yet worked out what
   * the caller for this is (another service??).
   *
   * @param releaseKey
   */
  public async getActiveManifest(
    releaseKey: string
  ): Promise<ManifestMasterType | null> {
    const releaseWithManifest = await e
      .select(e.release.Release, (r) => ({
        id: true,
        activation: {
          manifest: true,
        },
        filter: e.op(r.releaseKey, "=", releaseKey),
      }))
      .assert_single()
      .run(this.edgeDbClient);

    if (!releaseWithManifest) return null;

    // TODO fix exceptions here
    if (!releaseWithManifest.activation) return null;

    return releaseWithManifest.activation.manifest as ManifestMasterType;
  }

  /**
   * Create a structured/tree manifest for the data included in a release.
   * The job of the manifest is to give the structure of the data and enough
   * ids/file paths to enable a user with the manifest to understand where the files
   * are and how they relate to each other.
   *
   * The use case for this particular function is to provide a master data structure
   * for all other file manifest creation (i.e. htsget manifests, CSV manifests)
   *
   * @param executor
   * @param releaseKey the release whose selected entries should go into the manifest
   */
  public async createMasterManifest(
    executor: Executor,
    releaseKey: string
  ): Promise<ManifestMasterType> {
    const manifest = await releaseGetSpecimenTreeAndFileArtifacts(executor, {
      releaseKey: releaseKey,
    });

    return transformDbManifestToMasterManifest(manifest);
  }

  public async getActiveHtsgetManifest(
    releaseKey: string
  ): Promise<ManifestHtsgetType | null> {
    const masterManifest = await this.getActiveManifest(releaseKey);

    // TODO fix exceptions here
    if (!masterManifest) return null;

    return transformMasterManifestToHtsgetManifest(masterManifest);
  }

  async publishHtsgetManifestAuditFn(
    type: CloudStorageType,
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
      throw new HtsgetNotAllowed();
    }

    const storage = this.cloudStorageFactory.getStorage(type);

    if (storage === null) {
      throw new ManifestHtsgetStorageNotEnabled();
    }

    if (this.settings.htsget === undefined || this.settings.aws === undefined) {
      throw new ManifestHtsgetEndpointNotEnabled();
    }

    let shouldUpdate = false;
    try {
      // Should htsget have its own bucket, or is the tempBucket okay?
      const head = await storage.head(this.settings.aws.tempBucket, releaseKey);

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

      await storage.put(
        this.settings.aws.tempBucket,
        `${ManifestService.HTSGET_MANIFESTS_FOLDER}/${releaseKey}`,
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

    return output;
  }

  public async publishHtsgetManifest(
    type: CloudStorageType,
    releaseKey: string
  ): Promise<ManifestHtsgetResponseType> {
    return await this.auditLogService.systemAuditEventPattern(
      "publish htsget manifest",
      async (completeAuditFn) => {
        return await this.publishHtsgetManifestAuditFn(
          type,
          releaseKey,
          completeAuditFn
        );
      }
    );
  }

  public async createTsvManifest(masterManifest: ManifestMasterType) {}

  public async getActiveBucketKeyManifest(
    releaseKey: string
  ): Promise<ManifestBucketKeyType | null> {
    const masterManifest = await this.getActiveManifest(releaseKey);

    // TODO fix exceptions here
    if (!masterManifest) return null;

    return transformMasterManifestToBucketKeyManifest(masterManifest);
  }
}
