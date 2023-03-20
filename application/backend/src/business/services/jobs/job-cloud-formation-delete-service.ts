import * as edgedb from "edgedb";
import e from "../../../../dbschema/edgeql-js";
import { AuthenticatedUser } from "../../authenticated-user";
import { getReleaseInfo } from "../helpers";
import { ReleaseDetailType } from "@umccr/elsa-types";
import { inject, injectable, singleton } from "tsyringe";
import { SelectService } from "../select-service";
import { ReleaseService } from "../release-service";
import {
  AuditLogService,
  OUTCOME_MINOR_FAILURE,
  OUTCOME_SUCCESS,
} from "../audit-log-service";
import {
  CloudFormationClient,
  DeleteStackCommand,
  DescribeStacksCommand,
} from "@aws-sdk/client-cloudformation";
import { AwsAccessPointService } from "../aws-access-point-service";
import { JobsService, NotAuthorisedToControlJob } from "./jobs-base-service";

/**
 * A service for performing long-running operations deleting previously installed
 * Cloud Formation stacks.
 */
@injectable()
@singleton()
export class JobCloudFormationDeleteService extends JobsService {
  constructor(
    @inject("Database") edgeDbClient: edgedb.Client,
    auditLogService: AuditLogService,
    releaseService: ReleaseService,
    selectService: SelectService,
    @inject("CloudFormationClient") private cfnClient: CloudFormationClient
  ) {
    super(edgeDbClient, auditLogService, releaseService, selectService);
  }

  /**
   * Start the long-running (not really!) job of deleting a cloudformation stack
   * that has previously been installed for this release.
   *
   * @param user the user attempting the installation
   * @param releaseKey the release to install in the context of
   */
  public async startCloudFormationDeleteJob(
    user: AuthenticatedUser,
    releaseKey: string
  ): Promise<ReleaseDetailType> {
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
        "Delete S3 Access Point",
        new Date()
      );

      // we have *no* state information passed to us from previous install jobs.. all we
      // can say is that if a stack exists with our designated stack name then this is
      // something we are willing to delete
      const releaseStackName =
        AwsAccessPointService.getReleaseStackName(releaseKey);

      // describe the stacks with this name in order to return a more permanent stack id - that we can delete!
      const describeStacksResult = await this.cfnClient.send(
        new DescribeStacksCommand({
          StackName: releaseStackName,
        })
      );

      if (
        !describeStacksResult.Stacks ||
        describeStacksResult.Stacks.length < 1
      ) {
        // there is no stack for our release - we are mistakenly attempting to delete it
        throw new Error(
          `Unexpected result of no cloud formation stack with the correct name ${releaseStackName}`
        );
        // TODO: finish off the audit entry and create a 'failed' job representing that we didn't even
        //       get off the ground
      }

      if (describeStacksResult.Stacks.length > 1) {
        throw new Error(
          `Unexpected result of two cloud formation stacks with the same name ${releaseStackName}`
        );
        // TODO: finish off the audit entry and create a 'failed' job representing that we didn't even
        //       get off the ground
      }

      const theStack = describeStacksResult.Stacks[0];

      const deleteReleaseStackResult = await this.cfnClient.send(
        new DeleteStackCommand({
          StackName: theStack.StackId,
        })
      );

      if (!deleteReleaseStackResult) {
        throw new Error("Failed to even trigger the cloud formation delete");
        // TODO: finish off the audit entry and create a 'failed' job representing that we didn't even
        //       get off the ground
      }

      // create a new cloud formation delete entry
      await e
        .insert(e.job.CloudFormationDeleteJob, {
          forRelease: releaseQuery,
          status: e.job.JobStatus.running,
          started: e.datetime_current(),
          percentDone: e.int16(0),
          messages: e.literal(e.array(e.str), [
            "Triggered delete of stack in AWS",
          ]),
          auditEntry: e
            .select(e.audit.ReleaseAuditEvent, (ae) => ({
              filter: e.op(ae.id, "=", e.uuid(newAuditEventId)),
            }))
            .assert_single(),
          awsStackId: theStack.StackId!,
        })
        .run(tx);
    });

    // return the status of the release - which now has a runningJob
    return await this.releaseService.getBase(releaseKey, userRole);
  }

  /**
   * Do the busy work of the cloud formation delete job. As it turns out,
   * the busy work just involves asking AWS if the script has finished deleting - and
   * returning a status.
   *
   * @param jobId
   */
  public async doCloudFormationDeleteJob(jobId: string): Promise<number> {
    // TODO some security level here? does the user have permissions?

    const cfDeleteJobQuery = e
      .select(e.job.CloudFormationDeleteJob, (j) => ({
        forRelease: true,
        awsStackId: true,
        filter: e.op(j.id, "=", e.uuid(jobId)),
      }))
      .assert_single();

    const cfDeleteJob = await cfDeleteJobQuery.run(this.edgeDbClient);

    if (!cfDeleteJob)
      throw new Error("Job id passed in was not a Cloud Formation Delete Job");

    const describeStacksResult = await this.cfnClient.send(
      new DescribeStacksCommand({
        StackName: cfDeleteJob.awsStackId,
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
    if (theStack.StackStatus === "DELETE_COMPLETE") {
      return 0;
    }
    if (theStack.StackStatus === "DELETE_FAILED") {
      return 0;
    }

    console.log(theStack.StackStatus);

    return 0;
  }

  public async endCloudFormationDeleteJob(
    jobId: string,
    wasSuccessful: boolean
  ): Promise<void> {
    // basically at this point we believe the cloud formation is removed
    // we just need to clean up the records
    await this.edgeDbClient.transaction(async (tx) => {
      const cloudFormationDeleteQuery = e
        .select(e.job.CloudFormationDeleteJob, (j) => ({
          auditEntry: true,
          started: true,
          awsStackId: true,
          filter: e.op(j.id, "=", e.uuid(jobId)),
        }))
        .assert_single();

      const cloudFormationDeleteJob = await cloudFormationDeleteQuery.run(
        this.edgeDbClient
      );

      if (!cloudFormationDeleteJob)
        throw new Error(
          "Job id passed in was not a Cloud Formation Delete Job"
        );

      await this.auditLogService.completeReleaseAuditEvent(
        tx,
        cloudFormationDeleteJob.auditEntry.id,
        OUTCOME_SUCCESS,
        cloudFormationDeleteJob.started,
        new Date(),
        { jobId: jobId, awsStackId: cloudFormationDeleteJob.awsStackId }
      );

      await e
        .update(cloudFormationDeleteQuery, (sj) => ({
          set: {
            percentDone: 100,
            ended: e.datetime_current(),
            status: wasSuccessful
              ? e.job.JobStatus.succeeded
              : e.job.JobStatus.failed,
          },
        }))
        .run(tx);
    });
  }
}
