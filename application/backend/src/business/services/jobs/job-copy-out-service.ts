import * as edgedb from "edgedb";
import { Executor } from "edgedb";
import e from "../../../../dbschema/edgeql-js";
import { AuthenticatedUser } from "../../authenticated-user";
import { getReleaseInfo } from "../helpers";
import { ReleaseDetailType } from "@umccr/elsa-types";
import { inject, injectable, singleton } from "tsyringe";
import { SelectService } from "../select-service";
import { ReleaseService } from "../release-service";
import { AuditLogService, OUTCOME_SUCCESS } from "../audit-log-service";
import { JobsService, NotAuthorisedToControlJob } from "./jobs-base-service";
import {
  DescribeExecutionCommand,
  DescribeMapRunCommand,
  ExecutionStatus,
  ListMapRunsCommand,
  SFNClient,
  StartExecutionCommand,
} from "@aws-sdk/client-sfn";
import { AwsDiscoveryService } from "../aws-discovery-service";
import {
  CopyOutServiceNotInstalled,
  ReleaseNeedsActivationToStartJob,
} from "./job-exception";
import { ManifestService } from "../manifests/manifest-service";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { ElsaSettings } from "../../../config/elsa-settings";
import { randomBytes } from "crypto";
import assert from "node:assert";

/**
 * A service for performing long-running operations that copy out files
 * to another bucket - using an AWS Steps function (provided as an
 * external microservice).
 */
@injectable()
@singleton()
export class JobCopyOutService extends JobsService {
  public static readonly JOB_NAME = "CopyOut";

  constructor(
    @inject("Database") edgeDbClient: edgedb.Client,
    auditLogService: AuditLogService,
    releaseService: ReleaseService,
    selectService: SelectService,
    private readonly manifestService: ManifestService,
    private readonly awsDiscoveryService: AwsDiscoveryService,
    @inject("Settings") private readonly settings: ElsaSettings,
    @inject("S3Client") private readonly s3Client: S3Client,
    @inject("SFNClient") private readonly sfnClient: SFNClient
  ) {
    super(edgeDbClient, auditLogService, releaseService, selectService);
  }

  private async getCurrentJobWithExceptionForInvalid(
    executor: Executor,
    jobId: string
  ) {
    const copyOutJobQuery = e
      .select(e.job.CopyOutJob, (j) => ({
        auditEntry: true,
        started: true,
        percentDone: true,
        forRelease: true,
        awsExecutionArn: true,
        filter: e.op(j.id, "=", e.uuid(jobId)),
      }))
      .assert_single();

    const copyOutJob = await copyOutJobQuery.run(executor);

    if (!copyOutJob) throw new Error("Job id passed in was not a Copy Out Job");

    return copyOutJob;
  }

  private async updateCurrentJob(
    executor: Executor,
    jobId: string,
    toSet: any
  ) {
    await e
      .update(e.job.CopyOutJob, (j) => ({
        set: toSet,
        filter: e.op(j.id, "=", e.uuid(jobId)),
      }))
      .run(executor);
  }

  /**
   * Start a job that uses a steps function to Copy Out files.
   *
   * @param user the user attempting the installation
   * @param releaseKey the release to install in the context of
   * @param destinationBucket the S3 bucket that will eventually get the files
   */
  public async startCopyOutJob(
    user: AuthenticatedUser,
    releaseKey: string,
    destinationBucket: string
  ): Promise<ReleaseDetailType> {
    const { userRole, isActivated } =
      await this.releaseService.getBoundaryInfoWithThrowOnFailure(
        user,
        releaseKey
      );

    if (userRole != "Administrator")
      throw new NotAuthorisedToControlJob(userRole, releaseKey);

    if (!isActivated)
      throw new ReleaseNeedsActivationToStartJob(
        JobCopyOutService.JOB_NAME,
        releaseKey
      );

    const stepsArn = await this.awsDiscoveryService.locateCopyOutStepsArn();

    if (!stepsArn) throw new CopyOutServiceNotInstalled();

    const { releaseQuery } = await getReleaseInfo(
      this.edgeDbClient,
      releaseKey
    );

    await this.startGenericJob(releaseKey, async (tx) => {
      // by placing the audit event in the transaction I guess we miss out on
      // the ability to audit jobs that don't start at all - but maybe we do that
      // some other way
      const newAuditEventId = await this.auditLogService.startReleaseAuditEvent(
        tx,
        user,
        releaseKey,
        "E",
        "Copy Out",
        new Date()
      );

      const manifest = await this.manifestService.getActiveBucketKeyManifest(
        releaseKey
      );

      assert(
        manifest,
        "Active manifest appeared to be null even though this release has been activated"
      );

      let manifestCsv = "";

      for (const s of manifest.objects) {
        // TODO replace with a proper CSV writing component if this becomes an issue (I don't think we are going to hit many
        //      buckets or keys with quotes)
        if (s.bucket.includes('"'))
          throw new Error(
            `One of the buckets contains a quote character that we cannot handle yet - ${s.bucket}`
          );
        if (s.key.includes('"'))
          throw new Error(
            `One of the keys contains a quote character that we cannot handle yet - ${s.key}`
          );

        if (s.service === "s3") {
          // we wrap in quotes for safety - we know the AWS S3 parser *does* handle this correctly
          manifestCsv += `"${s.bucket}","${s.key}"\n`;
        }
      }

      // we want to generate a file list in our temp bucket - where the file list expires after 90 days
      // (this steps function can wait for up to a month for the destination bucket to be created/configured)
      const fileListKey = `90/${randomBytes(32).toString("hex")}`;

      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.settings.aws?.tempBucket,
          Key: fileListKey,
          ContentType: "text/csv",
          Body: Buffer.from(manifestCsv),
        })
      );

      const startExecutionResult = await this.sfnClient.send(
        new StartExecutionCommand({
          // name: releaseKey + "-" + JobCopyOutService.JOB_NAME + "-" +
          stateMachineArn: stepsArn,
          input: JSON.stringify({
            sourceFilesCsvBucket: this.settings.aws?.tempBucket,
            sourceFilesCsvKey: fileListKey,
            destinationBucket: destinationBucket,
            // we can set this here - or leave for default of 1
            // maxItemsPerBatch: 10
          }),
        })
      );

      if (!startExecutionResult.executionArn) {
        throw new Error(`Could not start copy out execution`);
        // TODO: finish off the audit entry and create a 'failed' job representing that we didn't even
        //       get off the ground
      }

      await e
        .insert(e.job.CopyOutJob, {
          forRelease: releaseQuery,
          status: e.job.JobStatus.running,
          started: e.datetime_current(),
          percentDone: e.int16(0),
          messages: e.literal(e.array(e.str), ["Started copy out in AWS"]),
          // we save a pointer to our related audit entry so that we can close it off later
          auditEntry: e
            .select(e.audit.ReleaseAuditEvent, (ae) => ({
              filter: e.op(ae.id, "=", e.uuid(newAuditEventId)),
            }))
            .assert_single(),
          awsExecutionArn: startExecutionResult.executionArn,
        })
        .run(tx);
    });

    // return the status of the release - which now has a runningJob
    return await this.releaseService.getBase(releaseKey, userRole);
  }

  /**
   * Progress the work of the copy out job. As it turns out,
   * the work just involves checking the status of the AWS steps
   * function we invoked.
   *
   * @param jobId
   */
  public async progressCopyOutJob(jobId: string): Promise<number> {
    // TODO some security level here? does the user have permissions?
    //      this method is only ever called by the job handler which acts with system level permissions??

    return await this.edgeDbClient.transaction(async (tx) => {
      const copyOutJob = await this.getCurrentJobWithExceptionForInvalid(
        tx,
        jobId
      );

      // get the status of the overall steps function that does copying
      const describeExecutionResult = await this.sfnClient.send(
        new DescribeExecutionCommand({
          executionArn: copyOutJob.awsExecutionArn,
        })
      );

      assert(
        describeExecutionResult,
        `Steps execution ARN ${copyOutJob.awsExecutionArn} unexpectedly disappeared`
      );

      // at our first polling after a successful launch - we upgrade to 1%
      if (copyOutJob.percentDone === 0)
        await this.updateCurrentJob(tx, jobId, {
          percentDone: 1,
        });

      // now we try to look into the map run (the actual copy) to see if we can get some stats from it
      {
        const listMapRunsResults = await this.sfnClient.send(
          new ListMapRunsCommand({
            executionArn: copyOutJob.awsExecutionArn,
          })
        );

        // we have only one map run in our steps so this can only ever be 1 or 0
        if (
          listMapRunsResults.mapRuns &&
          listMapRunsResults.mapRuns.length === 1
        ) {
          const describeMapResult = await this.sfnClient.send(
            new DescribeMapRunCommand({
              mapRunArn: listMapRunsResults.mapRuns[0].mapRunArn,
            })
          );

          // if we have an item count report out the percent done
          if (describeMapResult.itemCounts) {
            const countDone =
              describeMapResult.itemCounts.failed! +
              describeMapResult.itemCounts.succeeded! +
              describeMapResult.itemCounts.aborted! +
              describeMapResult.itemCounts.timedOut!;

            // we limit our 'to copy' items to a range between 1 and 99..
            // (we reserved 0 to mean we just started, and we reserve 100 to mean completely done)
            let percentDone = Math.ceil(
              (countDone * 100) / describeMapResult.itemCounts.total!
            );

            if (percentDone < 1) percentDone = 1;
            if (percentDone > 99) percentDone = 99;

            await this.updateCurrentJob(tx, jobId, {
              percentDone: percentDone,
            });
          }
        }
      }

      if (describeExecutionResult.status === ExecutionStatus.RUNNING) {
        return 1;
      }

      // TODO return different results depending on success/failure
      return 0;
    });
  }

  /**
   * End the copy out job by finishing off the job records and audit trail.
   *
   * @param jobId
   * @param wasSuccessful
   */
  public async endCopyOutJob(
    jobId: string,
    wasSuccessful: boolean
  ): Promise<void> {
    await this.edgeDbClient.transaction(async (tx) => {
      const copyOutJob = await this.getCurrentJobWithExceptionForInvalid(
        tx,
        jobId
      );

      await this.auditLogService.completeReleaseAuditEvent(
        tx,
        copyOutJob.auditEntry.id,
        OUTCOME_SUCCESS,
        copyOutJob.started,
        new Date(),
        { jobId: jobId, awsExecutionArn: copyOutJob.awsExecutionArn }
      );

      await this.updateCurrentJob(tx, jobId, {
        percentDone: 100,
        ended: e.datetime_current(),
        status: wasSuccessful
          ? e.job.JobStatus.succeeded
          : e.job.JobStatus.failed,
      });
    });
  }
}
