import { inject, injectable } from "tsyringe";
import e from "../../../../dbschema/edgeql-js";
import * as edgedb from "edgedb";
import { Executor } from "edgedb";
import { releaseGetSpecimenTreeAndFileArtifacts } from "../../../../dbschema/queries";
import { ManifestMasterType } from "./manifest-master-types";
import { transformDbManifestToMasterManifest } from "./manifest-master-helper";
import { transformMasterManifestToTsvManifest } from "./manifest-tsv-helper";
import { transformMasterManifestToBucketKeyManifest } from "./manifest-bucket-key-helper";
import {
  KnownObjectProtocolType,
  ManifestBucketKeyType,
  ManifestTsvBodyType,
} from "./manifest-bucket-key-types";
import archiver, { ArchiverOptions } from "archiver";
import { stringify } from "csv-stringify";
import { Readable } from "stream";
import streamConsumers from "node:stream/consumers";
import { ReleaseService } from "../releases/release-service";
import { AuthenticatedUser } from "../../authenticated-user";
import {
  ObjectStoreRecordKey,
  ReleaseSizeType,
} from "@umccr/elsa-types/schemas";
import { PresignedUrlService } from "../presigned-url-service";
import { ReleaseViewError } from "../../exceptions/release-authorisation";
import { AuditEventService } from "../audit-event-service";
import { getReleaseInfo } from "../helpers";
import { ReleaseActivatedNothingError } from "../../exceptions/release-activation";

@injectable()
export class ManifestService {
  constructor(
    @inject("Database") private readonly edgeDbClient: edgedb.Client,
    @inject(ReleaseService) private readonly releaseService: ReleaseService,
    @inject(AuditEventService)
    private readonly auditLogService: AuditEventService
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
        dataSharingConfiguration: {
          htsgetRestrictions: true,
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

    const manifest = releaseWithManifest.activation
      .manifest as ManifestMasterType;
    manifest.releaseHtsgetRestrictions =
      releaseWithManifest.dataSharingConfiguration.htsgetRestrictions;

    return manifest;
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

  /**
   * Return a summary of the actual amount of bytes and files that are included in
   * the tentative "current" release. This in no way actually makes a real release
   * manifest so we are less picky about rules like "variant data must be present if variants requested".
   *
   * @param user
   * @param releaseKey
   */
  public async computeReleaseSize(
    user: AuthenticatedUser,
    releaseKey: string
  ): Promise<ReleaseSizeType> {
    const { userRole } =
      await this.releaseService.getBoundaryInfoWithThrowOnFailure(
        user,
        releaseKey
      );

    if (!(userRole === "Administrator" || userRole === "AdminView")) {
      throw new ReleaseViewError(releaseKey);
    }

    const manifest = await releaseGetSpecimenTreeAndFileArtifacts(
      this.edgeDbClient,
      {
        releaseKey: releaseKey,
      }
    );

    // we want to create the manifest just for stats purposes so we switch off exceptions (exceptions caused
    // by there being no data for instance)
    const masterManifest = await transformDbManifestToMasterManifest(
      manifest,
      false
    );

    const numBytes = masterManifest.specimenList.reduce(
      (acc, cur) =>
        acc +
        cur.artifacts.reduce(
          (acc_, cur_) =>
            acc_ +
            (cur_?.bclFile?.size ?? 0) +
            (cur_?.forwardFile?.size ?? 0) +
            (cur_?.reverseFile?.size ?? 0) +
            (cur_?.bamFile?.size ?? 0) +
            (cur_?.baiFile?.size ?? 0) +
            (cur_?.cramFile?.size ?? 0) +
            (cur_?.craiFile?.size ?? 0) +
            (cur_?.vcfFile?.size ?? 0) +
            (cur_?.tbiFile?.size ?? 0),
          0
        ),
      0
    );

    const numObjects = masterManifest.specimenList.reduce(
      (acc, cur) =>
        acc +
        cur.artifacts.reduce(
          (acc_, cur_) =>
            acc_ +
            (cur_?.bclFile?.size ? 1 : 0) +
            (cur_?.forwardFile?.size ? 1 : 0) +
            (cur_?.reverseFile?.size ? 1 : 0) +
            (cur_?.bamFile?.size ? 1 : 0) +
            (cur_?.baiFile?.size ? 1 : 0) +
            (cur_?.cramFile?.size ? 1 : 0) +
            (cur_?.craiFile?.size ? 1 : 0) +
            (cur_?.vcfFile?.size ? 1 : 0) +
            (cur_?.tbiFile?.size ? 1 : 0),
          0
        ),
      0
    );

    return { numBytes, numObjects };
  }

  public async getActiveTsvManifest(
    presignedUrlService: PresignedUrlService,
    releaseKey: string,
    auditId: string
  ): Promise<ManifestTsvBodyType | null> {
    const masterManifest = await this.getActiveManifest(releaseKey);
    // TODO fix exceptions here
    if (!masterManifest) return null;

    return await transformMasterManifestToTsvManifest(
      masterManifest,
      presignedUrlService,
      releaseKey,
      auditId
    );
  }

  public async getActiveTsvManifestAsString(
    presignedUrlService: PresignedUrlService,
    user: AuthenticatedUser,
    releaseKey: string,
    header: (typeof ObjectStoreRecordKey)[number][]
  ): Promise<string | null> {
    const { userRole, isActivated } =
      await this.releaseService.getBoundaryInfoWithThrowOnFailure(
        user,
        releaseKey
      );

    if (!(userRole === "Manager" || userRole === "Member")) {
      throw new ReleaseViewError(releaseKey);
    }

    if (!isActivated) throw new Error("needs to be activated");

    const createTsv = async (auditId: string) => {
      const manifest = await this.getActiveTsvManifest(
        presignedUrlService,
        releaseKey,
        auditId
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
      return await streamConsumers.text(readableStream.pipe(stringifier));
    };

    const now = new Date();
    const newAuditEventId = await this.auditLogService.startReleaseAuditEvent(
      user,
      releaseKey,
      "E",
      "Created TSV",
      now,
      this.edgeDbClient
    );

    try {
      const tsv = createTsv(newAuditEventId);
      await this.auditLogService.completeReleaseAuditEvent(
        newAuditEventId,
        0,
        now,
        new Date(),
        { header },
        this.edgeDbClient
      );
      return tsv;
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
        this.edgeDbClient
      );

      throw e;
    }
  }

  public async getActiveTsvManifestAsArchive(
    presignedUrlService: PresignedUrlService,
    user: AuthenticatedUser,
    releaseKey: string,
    header: (typeof ObjectStoreRecordKey)[number][]
  ): Promise<archiver.Archiver | null> {
    const buf = await this.getActiveTsvManifestAsString(
      presignedUrlService,
      user,
      releaseKey,
      header
    );
    if (buf === null) {
      return buf;
    }

    const { releaseInfo } = await getReleaseInfo(this.edgeDbClient, releaseKey);
    const password = releaseInfo.releasePassword;

    // create archive and specify method of encryption and password
    let archive = archiver.create("zip-encrypted", {
      zlib: { level: 8 },
      encryptionMethod: "aes256",
      password: password,
    } as ArchiverOptions);

    archive.append(buf, { name: "manifest.tsv" });

    await archive.finalize();

    return archive;
  }

  /**
   * Return the active manifest for the given release in a form
   * that is basically a simple list of file objects.
   *
   * @param releaseKey
   * @param filterByProtocol a list of protocol (s3, gs, r2) to allow in the output, or an array containing "*" to mean all protocols
   */
  public async getActiveBucketKeyManifest(
    releaseKey: string,
    filterByProtocol: (KnownObjectProtocolType | "*")[] = ["*"]
  ): Promise<ManifestBucketKeyType | null> {
    const masterManifest = await this.getActiveManifest(releaseKey);

    // TODO fix exceptions here
    if (!masterManifest) return null;

    return transformMasterManifestToBucketKeyManifest(
      masterManifest,
      filterByProtocol
    );
  }
}
