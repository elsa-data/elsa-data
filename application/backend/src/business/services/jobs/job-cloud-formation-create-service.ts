import * as edgedb from "edgedb";
import e from "../../../../dbschema/edgeql-js";
import { AuthenticatedUser } from "../../authenticated-user";
import { getReleaseInfo } from "../helpers";
import { ReleaseDetailType } from "@umccr/elsa-types";
import { inject, injectable } from "tsyringe";
import { SelectService } from "../select-service";
import { ReleaseService } from "../releases/release-service";
import {
  AuditEventService,
  OUTCOME_MINOR_FAILURE,
  OUTCOME_SUCCESS,
} from "../audit-event-service";
import {
  CloudFormationClient,
  CreateStackCommand,
  DescribeStacksCommand,
} from "@aws-sdk/client-cloudformation";
import { AwsAccessPointService } from "../sharers/aws-access-point/aws-access-point-service";
import { JobService, NotAuthorisedToControlJob } from "./job-service";
import { AwsEnabledService } from "../aws/aws-enabled-service";
import { Logger } from "pino";

/**
 * A service for performing long-running operations creating new
 * Cloud Formation stacks.
 */
@injectable()
export class JobCloudFormationCreateService extends JobService {
  constructor(
    @inject("Database") readonly edgeDbClient: edgedb.Client,
    @inject("Logger") readonly logger: Logger,
    @inject(AuditEventService) readonly auditLogService: AuditEventService,
    @inject(ReleaseService) readonly releaseService: ReleaseService,
    @inject(SelectService) readonly selectService: SelectService,
    @inject("CloudFormationClient")
    private readonly cfnClient: CloudFormationClient,
    @inject(AwsEnabledService)
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
        user,
        releaseKey,
        "E",
        "Install AWS Access Point",
        new Date(),
        tx
      );

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
          s3HttpsUrl: s3HttpsUrl,
          // we have not yet started the cloud formation create - our first step will be to get this stack id
          // TODO: change schema to allow this to be optional
          awsStackId: "",
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
        forRelease: {
          releaseKey: true,
        },
        awsStackId: true,
        s3HttpsUrl: true,
        filter: e.op(j.id, "=", e.uuid(jobId)),
      }))
      .assert_single();

    const cfInstallJob = await cfInstallJobQuery.run(this.edgeDbClient);

    if (!cfInstallJob)
      throw new Error("Job id passed in was not a Cloud Formation Install Job");

    if (!cfInstallJob.awsStackId) {
      const releaseStackName = AwsAccessPointService.getReleaseStackName(
        cfInstallJob.forRelease.releaseKey
      );

      const newReleaseStack = await this.cfnClient.send(
        new CreateStackCommand({
          StackName: releaseStackName,
          TemplateURL: cfInstallJob.s3HttpsUrl,
          Capabilities: ["CAPABILITY_IAM"],
          OnFailure: "DELETE",
          // need to determine this number - but creating access points is pretty simple so
          // we only need to set this generously above the upper limit we see in practice
          TimeoutInMinutes: 5,
        })
      );

      if (!newReleaseStack || !newReleaseStack.StackId) {
        console.log("Failed to even trigger the cloud formation create");
        return 0;
      }

      await this.edgeDbClient.transaction(async (tx) => {
        const cloudFormationInstallQuery = e
          .select(e.job.CloudFormationInstallJob, (j) => ({
            auditEntry: true,
            started: true,
            filter: e.op(j.id, "=", e.uuid(jobId)),
          }))
          .assert_single();

        await e
          .update(cloudFormationInstallQuery, (sj) => ({
            set: {
              percentDone: 1,
              awsStackId: newReleaseStack.StackId,
            },
          }))
          .run(tx);
      });

      return 1;
    }

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

    this.logger.debug(theStack.StackStatus);

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
        cloudFormationInstallJob.auditEntry.id,
        isCancellation ? OUTCOME_MINOR_FAILURE : OUTCOME_SUCCESS,
        cloudFormationInstallJob.started,
        new Date(),
        { jobId: jobId },
        tx
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
