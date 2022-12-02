import { AuthenticatedUser } from "../authenticated-user";
import { doRoleInReleaseCheck, getReleaseInfo } from "./helpers";
import * as edgedb from "edgedb";
import { GetCallerIdentityCommand, STSClient } from "@aws-sdk/client-sts";
import { UsersService } from "./users-service";
import { AuditLogService } from "./audit-log-service";
import {
  createReleaseFileList,
  ReleaseFileListEntry,
} from "./_release-file-list-helper";

export abstract class AwsBaseService {
  private enabled: boolean;

  protected constructor(
    protected readonly edgeDbClient: edgedb.Client,
    protected readonly usersService: UsersService,
    protected readonly auditLogService: AuditLogService
  ) {
    // until we get proof our AWS commands have succeeded we assume AWS functionality is not available
    this.enabled = false;

    const stsClient = new STSClient({});

    stsClient
      .send(new GetCallerIdentityCommand({}))
      .then((result) => {
        this.enabled = true;
      })
      .catch((err) => {});
  }

  public get isEnabled(): boolean {
    return this.enabled;
  }

  protected enabledGuard() {
    if (!this.enabled)
      throw new Error(
        "This service is not enabled due to lack of AWS credentials"
      );
  }

  /**
   * Retrieve a list of file objects that are available to the given user
   * for the given release. This function returns *only* raw data from the
   * database - it does not attempt to 'sign urls' etc.
   *
   * @param user
   * @param releaseId
   * @protected
   */
  protected async getAllFileRecords(
    user: AuthenticatedUser,
    releaseId: string
  ): Promise<ReleaseFileListEntry[]> {
    this.enabledGuard();

    const { userRole } = await doRoleInReleaseCheck(
      this.usersService,
      user,
      releaseId
    );

    const { releaseSelectedSpecimensQuery, releaseInfo } = await getReleaseInfo(
      this.edgeDbClient,
      releaseId
    );

    return await this.edgeDbClient.transaction(async (tx) => {
      const releaseSelectedSpecimens = await releaseSelectedSpecimensQuery.run(
        tx
      );

      return await createReleaseFileList(
        tx,
        releaseSelectedSpecimens,
        // the data owner always can get *all* the data - they are not bound by the 'is allowed' setting
        userRole === "DataOwner" || releaseInfo.isAllowedReadData,
        userRole === "DataOwner" || releaseInfo.isAllowedVariantData
      );
    });
  }
}
