import { AuthenticatedUser } from "../authenticated-user";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import * as edgedb from "edgedb";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { inject, injectable, singleton } from "tsyringe";
import { UsersService } from "./users-service";
import { AwsBaseService } from "./aws-base-service";
import { AuditLogService } from "./audit-log-service";
import { Readable } from "stream";
import archiver, { ArchiverOptions } from "archiver";
import { stringify } from "csv-stringify";
import streamConsumers from "node:stream/consumers";
import { ReleaseService } from "./release-service";

@injectable()
@singleton()
export class AwsPresignedUrlsService extends AwsBaseService {
  constructor(
    @inject("Database") edgeDbClient: edgedb.Client,
    private releaseService: ReleaseService,
    usersService: UsersService,
    auditLogService: AuditLogService
  ) {
    super(edgeDbClient, usersService, auditLogService);
  }

  /**
   * For the allowed files of the given release, return an archive stream
   * that is the zip of a manifest TSV that holds presigned URLs for the files.
   *
   * @param user
   * @param releaseId
   */
  public async getPresigned(
    user: AuthenticatedUser,
    releaseId: string,
    presignHeader: string[]
  ): Promise<any> {
    // abort immediately if we don't have AWS enabled
    this.enabledGuard();

    const now = new Date();
    const newAuditEventId = await this.auditLogService.startReleaseAuditEvent(
      this.edgeDbClient,
      user,
      releaseId,
      "E",
      "Created AWS S3 Presigned Zip",
      now
    );

    const s3Client = new S3Client({});

    const presign = async (s3url: string) => {
      const _match = s3url.match(/^s3?:\/\/([^\/]+)\/?(.*?)$/);
      if (!_match) throw new Error("Bad format");
      const command = new GetObjectCommand({
        Bucket: _match[1],
        Key: _match[2],
      });
      return await getSignedUrl(s3Client, command, {
        expiresIn: 60 * 60 * 24 * 7,
      });
    };

    const allFiles = await this.getAllFileRecords(user, releaseId);

    // fill in the actual S3 signed urls
    for (const af of allFiles) af.s3Signed = await presign(af.s3Url!);

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

    const readableStream = Readable.from(allFiles);
    const buf = await streamConsumers.text(readableStream.pipe(stringifier));

    const password = await this.releaseService.getPassword(user, releaseId);
    const counter = await this.releaseService.getIncrementingCounter(
      user,
      releaseId
    );

    const filename = `release-${releaseId.replaceAll("-", "")}-${counter}.zip`;

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
      { numUrls: allFiles.length, filename: filename }
    );

    return {
      archive: archive,
      filename: filename,
    };
  }
}
