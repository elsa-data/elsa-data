import { AuthenticatedUser } from "../authenticated-user";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import e from "../../../dbschema/edgeql-js";
import * as edgedb from "edgedb";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { inject, injectable, singleton } from "tsyringe";
import { UsersService } from "./users-service";
import { AwsBaseService, ReleaseAwsFileRecord } from "./aws-base-service";
import { all } from "edgedb/dist/reflection/builders";

@injectable()
@singleton()
export class AwsPresignedUrlsService extends AwsBaseService {
  constructor(
    @inject("Database") edgeDbClient: edgedb.Client,
    usersService: UsersService
  ) {
    super(edgeDbClient, usersService);
  }

  public async getPresigned(
    user: AuthenticatedUser,
    releaseId: string
  ): Promise<ReleaseAwsFileRecord[] | null> {
    this.enabledGuard();

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

    // fill in the file record that we haven't yet done
    for (const af of allFiles) af.s3Signed = await presign(af.s3Url!);

    // our partial type is now fully filled in so we can fix the type
    return allFiles as ReleaseAwsFileRecord[];
  }
}
