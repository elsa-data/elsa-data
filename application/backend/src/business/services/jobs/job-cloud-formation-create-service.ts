import * as edgedb from "edgedb";
import e from "../../../../dbschema/edgeql-js";
import { AuthenticatedUser } from "../../authenticated-user";
import { getReleaseInfo } from "../helpers";
import { ReleaseDetailType } from "@umccr/elsa-types";
import { inject, injectable } from "tsyringe";
import { SelectService } from "../select-service";
import { ReleaseService } from "../release-service";
import {
  AuditLogService,
  OUTCOME_MINOR_FAILURE,
  OUTCOME_SUCCESS,
} from "../audit-log-service";
import {
  CloudFormationClient,
  CreateStackCommand,
  DescribeStacksCommand,
} from "@aws-sdk/client-cloudformation";
import { AwsAccessPointService } from "../aws/aws-access-point-service";
import { JobsService, NotAuthorisedToControlJob } from "./jobs-base-service";
import { AwsEnabledService } from "../aws/aws-enabled-service";

/**
 * A service for performing long-running operations creating new
 * Cloud Formation stacks.
 */
@injectable()
export class JobCloudFormationCreateService extends JobsService {
  constructor(
    @inject("Database") edgeDbClient: edgedb.Client,
    auditLogService: AuditLogService,
    releaseService: ReleaseService,
    selectService: SelectService,
    @inject("CloudFormationClient") private cfnClient: CloudFormationClient,
    private readonly awsEnabledService: AwsEnabledService
  ) {
    super(edgeDbClient, auditLogService, releaseService, selectService);
  }

  /**
   * @param user the user attempting the install
   * @param releaseKey the release to install in the context of
   * @param s3HttpsUrl a https://s3.. URL that represents the cloud formation template to install
   */
  public async startCloudFormationInstallJob(
    user: AuthenticatedUser,
    releaseKey: string,
    s3HttpsUrl: string
  ): Promise<ReleaseDetailType> {
    await this.awsEnabledService.enabledGuard();

    const { userRole } =
      await this.releaseService.getBoundaryInfoWithThrowOnFailure(
        user,
        releaseKey
      );

    if (userRole != "Administrator")
      throw new NotAuthorisedToControlJob(userRole, releaseKey);

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
        "Install S3 Access Point",
        new Date()
      );

      const releaseStackName =
        AwsAccessPointService.getReleaseStackName(releaseKey);

      const newReleaseStack = await this.cfnClient.send(
        new CreateStackCommand({
          StackName: releaseStackName,
          TemplateURL: s3HttpsUrl,
          Capabilities: ["CAPABILITY_IAM"],
          OnFailure: "DELETE",
          // need to determine this number - but creating access points is pretty simple so
          // we only need to set this generously above the upper limit we see in practice
          TimeoutInMinutes: 5,
        })
      );

      if (!newReleaseStack || !newReleaseStack.StackId) {
        throw new Error("Failed to even trigger the cloud formation create");

        // TODO: finish off the audit entry and create a 'failed' job representing that we didn't even
        //       get off the ground
      }

      // create a new cloud formation install entry
      await e
        .insert(e.job.CloudFormationInstallJob, {
          forRelease: releaseQuery,
          status: e.job.JobStatus.running,
          started: e.datetime_current(),
          percentDone: e.int16(0),
          messages: e.literal(e.array(e.str), ["Created"]),
          auditEntry: e
            .select(e.audit.ReleaseAuditEvent, (ae) => ({
              filter: e.op(ae.id, "=", e.uuid(newAuditEventId)),
            }))
            .assert_single(),
          awsStackId: newReleaseStack.StackId,
          s3HttpsUrl: s3HttpsUrl,
        })
        .run(tx);
    });

    // return the status of the release - which now has a runningJob
    return await this.releaseService.getBase(releaseKey, userRole);
  }

  /**
   * Do the busy work of the cloud formation install job. As it turns out,
   * the busy work just involves asking AWS if the script has finished installing - and
   * returning a status.
   *
   * @param jobId
   */
  public async doCloudFormationInstallJob(jobId: string): Promise<number> {
    // TODO some security level here? does the user have permissions?

    const cfInstallJobQuery = e
      .select(e.job.CloudFormationInstallJob, (j) => ({
        forRelease: true,
        awsStackId: true,
        filter: e.op(j.id, "=", e.uuid(jobId)),
      }))
      .assert_single();

    const cfInstallJob = await cfInstallJobQuery.run(this.edgeDbClient);

    if (!cfInstallJob)
      throw new Error("Job id passed in was not a Cloud Formation Install Job");

    const describeStacksResult = await this.cfnClient.send(
      new DescribeStacksCommand({
        StackName: cfInstallJob.awsStackId,
      })
    );

    if (
      !describeStacksResult.Stacks ||
      describeStacksResult.Stacks.length < 1
    ) {
      // the stack has disappeared.. abort the job
      console.log("Stack has disappeared");
      return 0;
    }

    if (describeStacksResult.Stacks.length > 1) {
      throw new Error(
        "Unexpected result of two cloud formation stacks with the same name"
      );
    }

    const theStack = describeStacksResult.Stacks[0];

    if (
      theStack.StackStatus === "CREATE_IN_PROGRESS" ||
      theStack.StackStatus === "DELETE_IN_PROGRESS"
    ) {
      return 1;
    }
    if (theStack.StackStatus === "CREATE_COMPLETE") {
      return 0;
    }

    console.log(theStack.StackStatus);

    return 0;
  }

  public async endCloudFormationInstallJob(
    jobId: string,
    wasSuccessful: boolean,
    isCancellation: boolean
  ): Promise<void> {
    // basically at this point we believe the cloud formation is installed
    // we just need to clean up the records
    await this.edgeDbClient.transaction(async (tx) => {
      const cloudFormationInstallQuery = e
        .select(e.job.CloudFormationInstallJob, (j) => ({
          auditEntry: true,
          started: true,
          filter: e.op(j.id, "=", e.uuid(jobId)),
        }))
        .assert_single();

      const cloudFormationInstallJob = await cloudFormationInstallQuery.run(
        this.edgeDbClient
      );

      if (!cloudFormationInstallJob)
        throw new Error(
          "Job id passed in was not a Cloud Formation Install Job"
        );

      await this.auditLogService.completeReleaseAuditEvent(
        tx,
        cloudFormationInstallJob.auditEntry.id,
        isCancellation ? OUTCOME_MINOR_FAILURE : OUTCOME_SUCCESS,
        cloudFormationInstallJob.started,
        new Date(),
        { jobId: jobId }
      );

      await e
        .update(cloudFormationInstallQuery, (sj) => ({
          set: {
            percentDone: 100,
            ended: e.datetime_current(),
            status: isCancellation
              ? e.job.JobStatus.cancelled
              : wasSuccessful
              ? e.job.JobStatus.succeeded
              : e.job.JobStatus.failed,
          },
        }))
        .run(tx);
    });
  }
}
