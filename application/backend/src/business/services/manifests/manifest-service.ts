import { inject, injectable } from "tsyringe";
import e from "../../../../dbschema/edgeql-js";
import * as edgedb from "edgedb";
import { Executor } from "edgedb";
import { releaseGetSpecimenTreeAndFileArtifacts } from "../../../../dbschema/queries";
import { ManifestMasterType } from "./manifest-master-types";
import { transformDbManifestToMasterManifest } from "./manifest-master-helper";
import { transformMasterManifestToHtsgetManifest } from "./manifest-htsget-helper";
import { transformMasterManifestToTsvManifest } from "./manifest-tsv-helper";
import { ManifestHtsgetType } from "./manifest-htsget-types";
import { transformMasterManifestToBucketKeyManifest } from "./manifest-bucket-key-helper";
import {
  ManifestBucketKeyType,
  ManifestTsvBodyType,
} from "./manifest-bucket-key-types";
import archiver, { ArchiverOptions } from "archiver";
import { stringify } from "csv-stringify";
import { Readable } from "stream";
import streamConsumers from "node:stream/consumers";
import { ReleaseService } from "../release-service";
import { AuthenticatedUser } from "../../authenticated-user";
import { ObjectStoreRecordKey } from "../../../../../common/elsa-types/schemas";
import { PresignedUrlsService } from "../presigned-urls-service";
import { ReleaseViewError } from "../../exceptions/release-authorisation";
import { AuditLogService } from "../audit-log-service";

@injectable()
export class ManifestService {
  constructor(
    @inject("Database") private edgeDbClient: edgedb.Client,
    private readonly releaseService: ReleaseService,
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

    if (JSON.stringify(releaseWithManifest.activation.manifest) === "{}")
      return null;

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

  public async getActiveTsvManifest(
    presignedUrlsService: PresignedUrlsService,
    releaseKey: string
  ): Promise<ManifestTsvBodyType | null> {
    const masterManifest = await this.getActiveManifest(releaseKey);

    // TODO fix exceptions here
    if (!masterManifest) return null;

    return await transformMasterManifestToTsvManifest(
      masterManifest,
      presignedUrlsService,
      releaseKey
    );
  }

  public async getArchivedActiveTsvManifest(
    presignedUrlsService: PresignedUrlsService,
    user: AuthenticatedUser,
    releaseKey: string,
    header: typeof ObjectStoreRecordKey[number][]
  ): Promise<archiver.Archiver | null> {
    const { userRole, isActivated } =
      await this.releaseService.getBoundaryInfoWithThrowOnFailure(
        user,
        releaseKey
      );

    if (!(userRole === "Manager" || userRole === "Member")) {
      throw new ReleaseViewError(releaseKey);
    }

    if (!isActivated) throw new Error("needs to be activated");

    const createPresignedZip = async () => {
      const manifest = await this.getActiveTsvManifest(
        presignedUrlsService,
        releaseKey
      );
      if (!manifest) return null;

      // setup a TSV stream
      const stringifyColumnOptions = [];
      for (const column of header) {
        stringifyColumnOptions.push({
          key: column,
          header: column.toUpperCase(),
        });
      }
      const stringifier = stringify({
        header: true,
        columns: stringifyColumnOptions,
        delimiter: "\t",
      });

      const readableStream = Readable.from(manifest);
      const buf = await streamConsumers.text(readableStream.pipe(stringifier));

      const password = await this.releaseService.getPassword(user, releaseKey);

      // create archive and specify method of encryption and password
      let archive = archiver.create("zip-encrypted", {
        zlib: { level: 8 },
        encryptionMethod: "aes256",
        password: password,
      } as ArchiverOptions);

      archive.append(buf, { name: "manifest.tsv" });

      await archive.finalize();

      return archive;
    };

    const now = new Date();
    const newAuditEventId = await this.auditLogService.startReleaseAuditEvent(
      this.edgeDbClient,
      user,
      releaseKey,
      "E",
      "Created Presigned Zip",
      now
    );

    try {
      const archive = createPresignedZip();
      await this.auditLogService.completeReleaseAuditEvent(
        this.edgeDbClient,
        newAuditEventId,
        0,
        now,
        new Date()
      );
      return archive;
    } catch (e) {
      const errorString = e instanceof Error ? e.message : String(e);

      await this.auditLogService.completeReleaseAuditEvent(
        this.edgeDbClient,
        newAuditEventId,
        8,
        now,
        new Date(),
        { error: errorString }
      );

      throw e;
    }
  }

  public async getActiveBucketKeyManifest(
    releaseKey: string
  ): Promise<ManifestBucketKeyType | null> {
    const masterManifest = await this.getActiveManifest(releaseKey);

    // TODO fix exceptions here
    if (!masterManifest) return null;

    return transformMasterManifestToBucketKeyManifest(masterManifest);
  }
}
