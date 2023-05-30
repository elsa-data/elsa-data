import { AuthenticatedUser } from "../authenticated-user";
import * as edgedb from "edgedb";
import { inject, injectable } from "tsyringe";
import { UserService } from "./user-service";
import { GcpEnabledService } from "./gcp-enabled-service";
import { AuditEventService } from "./audit-event-service";
import { Storage } from "@google-cloud/storage";
import { getAllFileRecords } from "./_release-file-list-helper";
import pLimit, { Limit } from "p-limit";
import { ReleaseService } from "./release-service";
import { ManifestBucketKeyObjectType } from "./manifests/manifest-bucket-key-types";

@injectable()
export class GcpStorageSharingService {
  private readonly storage: Storage;
  private readonly globalLimit: Limit;
  private readonly objectLimits: { [uri: string]: Limit };

  constructor(
    @inject("Database") protected edgeDbClient: edgedb.Client,
    @inject(UserService) private readonly userService: UserService,
    @inject(ReleaseService) private readonly releaseService: ReleaseService,
    @inject(AuditEventService)
    private readonly auditLogService: AuditEventService,
    @inject(GcpEnabledService)
    private readonly gcpEnabledService: GcpEnabledService
  ) {
    this.storage = new Storage();

    // GCP probably rate-limits API requests, otherwise their `Storage` library
    // wouldn't have retry logic and tests for rate-limit exceptions.
    // Unfortunately, I can't find the documentation to say what the limits are.
    // A different GCP feature, OAuth, has a quota which is "Dependent on
    // application history, developer reputation, and riskiness".
    // (Source: https://support.google.com/cloud/answer/9028764?hl=en). So there
    // might not be a concrete answer as to what the relevant limits are.
    const concurrencyLimit = 10;
    this.globalLimit = pLimit(concurrencyLimit);

    // GCP will complain if we attempt to modify ACLs on the same object
    // concurrently, so we'll make a queue for each object.
    this.objectLimits = {};
  }

  /**
   * GCP will raise an exception if one object has concurrent modifications
   * made to it.
   *
   * @returns An object which enqueues operations on objects such that they happen one-at-a-time.
   */
  getObjectLimit(bucket: string, key: string): Limit {
    const uri = `gs://${bucket}/${key}`;
    if (!(uri in this.objectLimits)) {
      this.objectLimits[uri] = pLimit(1);
    }
    return this.objectLimits[uri];
  }

  modifyObjectPrincipalFn(
    operation: "add" | "delete",
    bucket: string,
    key: string,
    releaseKey: string,
    principal: string
  ): () => Promise<void> {
    const go = async () => {
      await this.gcpEnabledService.enabledGuard();

      await this.storage
        .bucket(bucket)
        .file(key)
        .acl[operation]({
          entity: `user-${principal}`,
          role: Storage.acl.READER_ROLE,
        });
    };

    const objectLimit = this.getObjectLimit(bucket, key);

    return () => objectLimit(go);
  }

  modifyObjectPrincipalsFns(
    operation: "add" | "delete",
    bucket: string,
    key: string,
    releaseKey: string,
    principals: string[]
  ): (() => Promise<void>)[] {
    return principals.map((principal) =>
      this.modifyObjectPrincipalFn(
        operation,
        bucket,
        key,
        releaseKey,
        principal
      )
    );
  }

  modifyObjectsPrincipalsFns(
    operation: "add" | "delete",
    allFiles: ManifestBucketKeyObjectType[],
    releaseKey: string,
    principals: string[]
  ): (() => Promise<void>)[] {
    return allFiles.flatMap((f) =>
      this.modifyObjectPrincipalsFns(
        operation,
        f.objectStoreBucket,
        f.objectStoreKey,
        releaseKey,
        principals
      )
    );
  }

  /**
   * Adds or deletes IAM ACLs from all the objects in a release. Additionally,
   * metadata is added to or delete from the objects indicating which release
   * they belong to.
   *
   * @param operation whether to add or delete IAM ACLs
   * @param user
   * @param releaseKey The release containing the objects whose ACLs will be modified
   * @param principals The IAM principals to be added or delete from the objects' ACLs
   *
   * @returns The number of objects modified
   */
  async modifyUsers(
    operation: "add" | "delete",
    user: AuthenticatedUser,
    releaseKey: string,
    principals: string[]
  ): Promise<number> {
    const { userRole } =
      await this.releaseService.getBoundaryInfoWithThrowOnFailure(
        user,
        releaseKey
      );

    if (userRole != "Administrator") {
      throw new Error("");
    }

    const now = new Date();
    const newAuditEventId = await this.auditLogService.startReleaseAuditEvent(
      user,
      releaseKey,
      "E",
      "Modified GCP object ACLs for release",
      now,
      this.edgeDbClient
    );

    const allFiles = await getAllFileRecords(
      this.edgeDbClient,
      this.userService,
      user,
      releaseKey
    );

    const shareFns = this.modifyObjectsPrincipalsFns(
      operation,
      allFiles,
      releaseKey,
      principals
    );

    const numberOfFilesModified = principals.length === 0 ? 0 : allFiles.length;

    try {
      await Promise.all(shareFns.map((fn) => this.globalLimit(fn)));
    } catch (e) {
      const errorString = e instanceof Error ? e.message : String(e);

      await this.auditLogService.completeReleaseAuditEvent(
        newAuditEventId,
        8,
        now,
        new Date(),
        { error: errorString },
        this.edgeDbClient
      );

      throw e;
    }

    await this.auditLogService.completeReleaseAuditEvent(
      newAuditEventId,
      0,
      now,
      new Date(),
      { numUrls: numberOfFilesModified },
      this.edgeDbClient
    );

    return numberOfFilesModified;
  }

  async addUsers(
    user: AuthenticatedUser,
    releaseKey: string,
    principals: string[]
  ): Promise<number> {
    await this.gcpEnabledService.enabledGuard();

    return await this.modifyUsers("add", user, releaseKey, principals);
  }

  async deleteUsers(
    user: AuthenticatedUser,
    releaseKey: string,
    principals: string[]
  ): Promise<number> {
    await this.gcpEnabledService.enabledGuard();

    return await this.modifyUsers("delete", user, releaseKey, principals);
  }
}
