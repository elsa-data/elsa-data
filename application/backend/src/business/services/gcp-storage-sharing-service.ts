import { AuthenticatedUser } from "../authenticated-user";
import * as edgedb from "edgedb";
import { inject, injectable, singleton } from "tsyringe";
import { UsersService } from "./users-service";
import { GcpBaseService } from "./gcp-base-service";
import { AuditLogService } from "./audit-log-service";
import { Storage } from "@google-cloud/storage";
import {
  getAllFileRecords,
  ReleaseFileListEntry,
} from "./_release-file-list-helper";
import pLimit, { Limit } from "p-limit";
import { Metadata } from "@google-cloud/storage/build/src/nodejs-common";
import { ReleaseService } from "./release-service";

@injectable()
@singleton()
export class GcpStorageSharingService extends GcpBaseService {
  storage: Storage;
  globalLimit: Limit;
  objectLimits: { [uri: string]: Limit };

  constructor(
    @inject("Database") protected edgeDbClient: edgedb.Client,
    private usersService: UsersService,
    private releaseService: ReleaseService,
    private auditLogService: AuditLogService
  ) {
    super();

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

  /**
   * Adds/removes a metadata key-value pair to an object which indicates release
   * membership.
   *
   * @param operation whether to add or delete the release's metadata
   * @param bucket the bucket which the object belongs to
   * @param key the object's key
   * @param releaseKey the release the object belongs to
   */
  modifyObjectMetadataFn(
    operation: "add" | "delete",
    bucket: string,
    key: string,
    releaseKey: string
  ): () => Promise<void> {
    // TODO(DoxasticFox): Delete me when we start using the release service
    // to figure out which objects belong to an active release
    const go = async () => {
      const metadataKey = `elsa-data-release-id-${releaseKey}`;

      var updatedMetadata: Metadata = {};

      if (operation === "add") {
        updatedMetadata = {
          metadata: {
            [metadataKey]: true,
          },
        };
      } else if (operation === "delete") {
        updatedMetadata = {
          metadata: {
            [metadataKey]: null,
          },
        };
      } else {
        throw Error(`Unexpected operation ${operation}`);
      }

      await this.storage.bucket(bucket).file(key).setMetadata(updatedMetadata);
    };

    const objectLimit = this.getObjectLimit(bucket, key);

    return () => objectLimit(go);
  }

  modifyObjectPrincipalFn(
    operation: "add" | "delete",
    bucket: string,
    key: string,
    releaseKey: string,
    principal: string
  ): () => Promise<void> {
    const go = async () => {
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
    return [
      ...principals.map((principal) =>
        this.modifyObjectPrincipalFn(
          operation,
          bucket,
          key,
          releaseKey,
          principal
        )
      ),
      this.modifyObjectMetadataFn(operation, bucket, key, releaseKey),
    ];
  }

  modifyObjectsPrincipalsFns(
    operation: "add" | "delete",
    allFiles: ReleaseFileListEntry[],
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
      this.edgeDbClient,
      user,
      releaseKey,
      "E",
      "Modified GCP object ACLs for release",
      now
    );

    const allFiles = await getAllFileRecords(
      this.edgeDbClient,
      this.usersService,
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
        this.edgeDbClient,
        newAuditEventId,
        8,
        now,
        new Date(),
        { error: errorString }
      );

      throw e;
    }

    await this.auditLogService.completeReleaseAuditEvent(
      this.edgeDbClient,
      newAuditEventId,
      0,
      now,
      new Date(),
      { numUrls: numberOfFilesModified }
    );

    return numberOfFilesModified;
  }

  async addUsers(
    user: AuthenticatedUser,
    releaseKey: string,
    principals: string[]
  ): Promise<number> {
    return await this.modifyUsers("add", user, releaseKey, principals);
  }

  async deleteUsers(
    user: AuthenticatedUser,
    releaseKey: string,
    principals: string[]
  ): Promise<number> {
    return await this.modifyUsers("delete", user, releaseKey, principals);
  }

  async manifest(
    user: AuthenticatedUser,
    releaseKey: string,
    tsvColumns: string[]
  ): Promise<{ filename: string; content: string }> {
    // TODO(DoxasticFox): Implement me. A manifest getter is already implemented
    // here: application/backend/src/business/services/aws-access-point-service.ts
    //
    // Though, once it's implemented, it's probably better to use the release
    // service which @andrewpatto started working on here:
    // https://github.com/umccr/elsa-data/pull/186
    return { filename: "", content: "" };
  }
}
