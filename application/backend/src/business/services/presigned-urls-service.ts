import { AuthenticatedUser } from "../authenticated-user";
import * as edgedb from "edgedb";
import { inject, injectAll, injectable, singleton } from "tsyringe";
import { UsersService } from "./users-service";
import { AuditLogService } from "./audit-log-service";
import { Readable } from "stream";
import archiver, { ArchiverOptions } from "archiver";
import { stringify } from "csv-stringify";
import streamConsumers from "node:stream/consumers";
import { ReleaseService } from "./release-service";
import { ElsaSettings } from "../../config/elsa-settings";
import { ReleaseViewError } from "../exceptions/release-authorisation";
import { ManifestService } from "./manifests/manifest-service";
import assert from "assert";

export interface IPresignedUrlProvider {
  isEnabled: boolean;
  protocol: string;
  presign(releaseKey: string, bucket: string, key: string): Promise<string>;
}

@injectable()
export class PresignedUrlsService {
  constructor(
    @inject("Database") protected readonly edgeDbClient: edgedb.Client,
    @inject("Settings") private readonly settings: ElsaSettings,
    @injectAll("IPresignedUrlProvider")
    private readonly presignedUrlsServices: IPresignedUrlProvider[],
    private readonly releaseService: ReleaseService,
    private readonly usersService: UsersService,
    private readonly manifestService: ManifestService,
    private readonly auditLogService: AuditLogService
  ) {}

  public get isEnabled(): boolean {
    return this.presignedUrlsServices.some((p) => p.isEnabled);
  }

  private async presign(
    releaseKey: string,
    protocol: string,
    bucket: string,
    key: string
  ): Promise<string> {
    for (const p of this.presignedUrlsServices)
      if (protocol === p.protocol) return p.presign(releaseKey, bucket, key);

    throw new Error(`Unhandled protocol ${protocol}`);
  }

  /**
   * For the allowed files of the given release, return an archive stream
   * that is the zip of a manifest TSV that holds presigned URLs for the files.
   *
   * @param user
   * @param releaseKey
   * @param presignHeader the CSV headers to include in the output
   */
  public async getPresigned(
    user: AuthenticatedUser,
    releaseKey: string,
    presignHeader: string[]
  ): Promise<any> {
    const { userRole, isActivated } =
      await this.releaseService.getBoundaryInfoWithThrowOnFailure(
        user,
        releaseKey
      );

    // the decision here is that administrators of a release cannot download the files in TSV
    // as that is not the appropriate way for them to access files (noting they already kind of have access
    // to the files - its just that this isn't the right path to get file urls)
    if (!(userRole === "Manager" || userRole === "Member")) {
      throw new ReleaseViewError(releaseKey);
    }

    if (!isActivated) throw new Error("needs to be activated");

    const now = new Date();
    const newAuditEventId = await this.auditLogService.startReleaseAuditEvent(
      this.edgeDbClient,
      user,
      releaseKey,
      "E",
      "Created Presigned Zip",
      now
    );

    const manifest = await this.manifestService.getActiveBucketKeyManifest(
      releaseKey
    );

    assert(manifest);

    // fill in the actual signed urls
    for (const af of manifest.objects) {
      try {
        af.objectStoreSigned = af.objectStoreUrl
          ? await this.presign(
              releaseKey,
              af.objectStoreProtocol,
              af.objectStoreBucket,
              af.objectStoreKey
            )
          : undefined;
      } catch (e) {
        const errorString = e instanceof Error ? e.message : String(e);

        await this.auditLogService.completeReleaseAuditEvent(
          this.edgeDbClient,
          newAuditEventId,
          8,
          now,
          new Date(),
          {
            objectStoreUrl: af.objectStoreUrl,
            error: errorString,
          }
        );

        throw e;
      }
    }

    // setup a TSV stream
    const stringifyColumnOptions = [];
    for (const header of presignHeader) {
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

    const readableStream = Readable.from(manifest.objects);
    const buf = await streamConsumers.text(readableStream.pipe(stringifier));

    const password = await this.releaseService.getPassword(user, releaseKey);
    const counter = await this.releaseService.getIncrementingCounter(
      user,
      releaseKey
    );

    const filename = `release-${releaseKey.replaceAll("-", "")}-${counter}.zip`;

    // create archive and specify method of encryption and password
    let archive = archiver.create("zip-encrypted", {
      zlib: { level: 8 },
      encryptionMethod: "aes256",
      password: password,
    } as ArchiverOptions);

    archive.append(buf, { name: "manifest.tsv" });

    await archive.finalize();

    await this.auditLogService.completeReleaseAuditEvent(
      this.edgeDbClient,
      newAuditEventId,
      0,
      now,
      new Date(),
      { numUrls: manifest.objects.length, filename: filename }
    );

    /* *************************************************************************
     * For demonstration purposes, will add some DataEgressAudit after link has been generated
     * This will show a data access log from the given file above.
     * ************************************************************************* */

    // const ipAddress = "128.250.161.231";
    // const ipLocation = "Melbourne, VIC, AU";
    // const mockTimeAccessed = new Date("2022-01-01 05:51:30.000 UTC");

    // // Insert all records except the last to be able to demonstrate incomplete download log
    // for (const file of manifest.objects.slice(0, -1)) {
    //   await this.auditLogService.updateDataAccessAuditEvent({
    //     executor: this.edgeDbClient,
    //     releaseKey: releaseKey,
    //     whoId: ipAddress,
    //     whoDisplayName: ipLocation,
    //     fileUrl: file.objectStoreUrl,
    //     description: "Data read from presigned URL.",
    //     egressBytes: Number(file.objectSize),
    //     date: mockTimeAccessed,
    //   });
    // }

    // // Insert first record twice to show multiple-download in UI
    // await this.auditLogService.updateDataAccessAuditEvent({
    //   executor: this.edgeDbClient,
    //   releaseKey: releaseKey,
    //   whoId: ipAddress,
    //   whoDisplayName: ipLocation,
    //   fileUrl: manifest.objects[0].objectStoreUrl,
    //   description: "Data read from presigned URL.",
    //   egressBytes: Number(manifest.objects[0].objectSize),
    //   date: mockTimeAccessed,
    // });

    // // Insert last record to be incomplete
    // const lastFile = manifest.objects.pop();
    // if (lastFile) {
    //   await this.auditLogService.updateDataAccessAuditEvent({
    //     executor: this.edgeDbClient,
    //     releaseKey: releaseKey,
    //     whoId: ipAddress,
    //     whoDisplayName: ipLocation,
    //     fileUrl: lastFile.objectStoreUrl,
    //     description: "Data read from presigned URL.",
    //     egressBytes: Math.floor(Number(lastFile.objectSize) / 2),
    //     date: mockTimeAccessed,
    //   });
    // }

    /* ************************************************************************ */

    return {
      archive: archive,
      filename: filename,
    };
  }
}
