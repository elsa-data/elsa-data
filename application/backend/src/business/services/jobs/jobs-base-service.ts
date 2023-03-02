import * as edgedb from "edgedb";
import e from "../../../../dbschema/edgeql-js";
import { AuthenticatedUser } from "../../authenticated-user";
import { doRoleInReleaseCheck, getReleaseInfo } from "../helpers";
import { Base7807Error } from "@umccr/elsa-types/error-types";
import { ReleaseDetailType } from "@umccr/elsa-types";
import { inject, injectable, singleton } from "tsyringe";
import { differenceInSeconds } from "date-fns";
import { SelectService } from "../select-service";
import { ReleaseService } from "../release-service";
import { UsersService } from "../users-service";
import { Transaction } from "edgedb/dist/transaction";
import { AuditLogService } from "../audit-log-service";
import { vcfArtifactUrlsBySpecimenQuery } from "../../db/lab-queries";
import {
  CloudFormationClient,
  CreateStackCommand,
  DescribeStacksCommand,
} from "@aws-sdk/client-cloudformation";
import { AwsAccessPointService } from "../aws-access-point-service";

class NotAuthorisedToControlJob extends Base7807Error {
  constructor(userRole: string, releaseId: string) {
    super(
      "Not authorised to control jobs for this release",
      403,
      `User is only a ${userRole} in the release ${releaseId}`
    );
  }
}

@injectable()
@singleton()
export class JobsService {
  constructor(
    @inject("Database") private edgeDbClient: edgedb.Client,
    @inject("CloudFormationClient")
    private readonly cfnClient: CloudFormationClient,

    private usersService: UsersService,
    private auditLogService: AuditLogService,
    private releasesService: ReleaseService,
    private selectService: SelectService
  ) {}

  /**
   * The internal mechanism for subclasses to generically start a long
   * running job.
   *
   * @param releaseId
   * @param finalJobStartStep
   * @protected
   */
  protected async startGenericJob(
    releaseId: string,
    finalJobStartStep: (tx: Transaction) => Promise<void>
  ) {
    await this.edgeDbClient.transaction(async (tx) => {
      // we do not use the 'exclusive constraint's of edgedb because we want to
      // retain the link to the release - but with the constraint there is
      // only one *running* job per release - and exclusive constraints cannot have filters

      // so we need to check here inside a transaction to make sure that this
      // is the only running job for this release
      const oldJob = await e
        .select(e.job.Job, (j) => ({
          id: true,
          filter: e.op(
            e.op(j.status, "=", e.job.JobStatus.running),
            "and",
            e.op(j.forRelease.id, "=", e.uuid(releaseId))
          ),
        }))
        .run(tx);

      if (oldJob && oldJob.length > 0)
        throw new Base7807Error(
          "Only one running job is allowed per release",
          400,
          `Job with id(s) ${oldJob
            .map((oj) => oj.id)
            .join(" ")} have been found in the running state`
        );

      await finalJobStartStep(tx);
    });
  }

  /**
   * Return the ids for any jobs that are currently in progress. This is the main
   * entry to the job system for our worker threads looking for work.
   */
  public async getInProgressJobs() {
    const jobsInProgress = await e
      .select(e.job.Job, (j) => ({
        __type__: { name: true },
        id: true,
        forRelease: { id: true },
        requestedCancellation: true,
        auditEntry: true,
        started: true,
        filter: e.op(j.status, "=", e.job.JobStatus.running),
      }))
      .run(this.edgeDbClient);

    return jobsInProgress.map((j) => {
      // we need to return the job type so the job system can know which 'work' to do
      const typeName = j.__type__.name;

      if (typeName.startsWith("job::")) {
        return {
          jobId: j.id,
          jobType: typeName.substring("job::".length),
          releaseId: j.forRelease.id,
          auditEntryId: j.auditEntry.id,
          auditEntryStarted: j.started,
          requestedCancellation: j.requestedCancellation,
        };
      } else
        throw new Error(
          "Our job type name no longer starts with the expected module of job::"
        );
    });
  }

  /**
   * @param user the user attempting the install
   * @param releaseId the release to install in the context of
   * @param s3HttpsUrl a https://s3.. URL that represents the cloud formation template to install
   */
  public async startCloudFormationInstallJob(
    user: AuthenticatedUser,
    releaseId: string,
    s3HttpsUrl: string
  ): Promise<ReleaseDetailType> {
    const { userRole } = await doRoleInReleaseCheck(
      this.usersService,
      user,
      releaseId
    );

    if (userRole != "DataOwner")
      throw new NotAuthorisedToControlJob(userRole, releaseId);

    const { releaseQuery } = await getReleaseInfo(this.edgeDbClient, releaseId);

    await this.startGenericJob(releaseId, async (tx) => {
      // by placing the audit event in the transaction I guess we miss out on
      // the ability to audit jobs that don't start at all - but maybe we do that
      // some other way
      const newAuditEventId = await this.auditLogService.startReleaseAuditEvent(
        tx,
        user,
        releaseId,
        "E",
        "Install S3 Access Point",
        new Date()
      );

      const releaseStackName =
        AwsAccessPointService.getReleaseStackName(releaseId);

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
        throw new Error("Failed to even trigger the cloud formation");

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
    return await this.releasesService.getBase(releaseId, userRole);
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

  /**
   * For a given release, start a background job identifying/selecting cases/patients/specimens
   * that should be included. Returns the release information which will now have
   * a 'runningJob' field.
   *
   * @param user
   * @param releaseId
   */
  public async startSelectJob(
    user: AuthenticatedUser,
    releaseId: string
  ): Promise<ReleaseDetailType> {
    const { userRole } = await doRoleInReleaseCheck(
      this.usersService,
      user,
      releaseId
    );

    if (userRole != "DataOwner")
      throw new NotAuthorisedToControlJob(userRole, releaseId);

    const { releaseQuery, releaseAllDatasetCasesQuery } = await getReleaseInfo(
      this.edgeDbClient,
      releaseId
    );

    await this.startGenericJob(releaseId, async (tx) => {
      // by placing the audit event in the transaction I guess we miss out on
      // the ability to audit jobs that don't start at all - but maybe we do that
      // some other way
      const newAuditEventId = await this.auditLogService.startReleaseAuditEvent(
        tx,
        user,
        releaseId,
        "E",
        "Ran Dynamic Consent",
        new Date()
      );

      // create a new select job entry
      await e
        .insert(e.job.SelectJob, {
          forRelease: releaseQuery,
          status: e.job.JobStatus.running,
          started: e.datetime_current(),
          percentDone: e.int16(0),
          messages: e.literal(e.array(e.str), ["Created"]),
          initialTodoCount: e.count(releaseAllDatasetCasesQuery),
          todoQueue: releaseAllDatasetCasesQuery,
          selectedSpecimens: e.set(),
          auditEntry: e
            .select(e.audit.ReleaseAuditEvent, (ae) => ({
              filter: e.op(ae.id, "=", e.uuid(newAuditEventId)),
            }))
            .assert_single(),
        })
        .run(tx);
    });

    // return the status of the release - which now has a runningJob
    return await this.releasesService.getBase(releaseId, userRole);
  }

  public async cancelInProgressSelectJob(
    user: AuthenticatedUser,
    releaseId: string
  ): Promise<ReleaseDetailType> {
    const { userRole } = await doRoleInReleaseCheck(
      this.usersService,
      user,
      releaseId
    );

    if (userRole != "DataOwner")
      throw new NotAuthorisedToControlJob(userRole, releaseId);

    const { releaseQuery, releaseAllDatasetCasesQuery } = await getReleaseInfo(
      this.edgeDbClient,
      releaseId
    );

    await this.edgeDbClient.transaction(async (tx) => {
      const currentJob = await e
        .select(e.job.Job, (j) => ({
          id: true,
          filter: e.op(
            e.op(j.status, "=", e.job.JobStatus.running),
            "and",
            e.op(j.forRelease.id, "=", e.uuid(releaseId))
          ),
        }))
        .assert_single()
        .run(tx);

      if (!currentJob) throw new Error("No job yet");

      const x = await e
        .update(e.job.SelectJob, (sj) => ({
          filter: e.op(sj.id, "=", e.uuid(currentJob.id)),
          set: {
            requestedCancellation: true,
          },
        }))
        .run(tx);
    });

    // return the status of the release - which will not really have changed (because cancellations
    // take a while to happen)
    return await this.releasesService.getBase(releaseId, userRole);
  }

  /**
   * Safely do a batch of work from the queue of work for the given
   * release.
   *
   * @param jobId
   * @param roughlyMaxSeconds roughly the number of seconds we should process items for (may exceed)
   */
  public async doSelectJobWork(
    jobId: string,
    roughlyMaxSeconds: number
  ): Promise<number> {
    const selectJobQuery = e
      .select(e.job.SelectJob, (j) => ({
        filter: e.op(j.id, "=", e.uuid(jobId)),
      }))
      .assert_single();

    if (!(await selectJobQuery.run(this.edgeDbClient)))
      throw new Error("Job id passed in was not a Select Job");

    const selectJobReleaseQuery = e.select(selectJobQuery.forRelease);

    const applicationCoded = await e
      .select(selectJobReleaseQuery.applicationCoded, (ac) => ({
        ...e.release.ApplicationCoded["*"],
      }))
      .run(this.edgeDbClient);

    const startTime = new Date();
    let processedCount = 0;

    // we want our job processing to be 'time' focussed... so do work until we roughly hit the
    // maximum time allotted
    while (differenceInSeconds(startTime, new Date()) < 10) {
      // we need to process a job off the queue - create the corresponding result (if any) - and save the result
      // we do this transactionally so we can never miss an item
      const c = await this.edgeDbClient.transaction(async (tx) => {
        const casesFromQueue = await e
          .select(selectJobQuery.todoQueue, (c) => ({
            ...e.dataset.DatasetCase["*"],
            dataset: {
              ...e.dataset.Dataset["*"],
            },
            patients: {
              ...e.dataset.DatasetPatient["*"],
              specimens: {
                ...e.dataset.DatasetSpecimen["*"],
              },
            },
            limit: 1,
          }))
          .run(tx);

        // todo: need to work out the magic of how EdgeDb wants us to type this kind of stuff...
        // (it can't be like this??)
        // edgedb.reflection.$expr_Literal<
        //           edgedb.reflection.ScalarType<"std::uuid", string, true, string>
        //         >
        const resultSpecimens: any[] = [];

        const resultMessages: string[] = [];

        // todo: get some messages back from the selection service
        resultMessages.push("Doing some work");

        for (const cas of casesFromQueue) {
          for (const pat of cas.patients || []) {
            for (const spec of pat.specimens || []) {
              const r = await vcfArtifactUrlsBySpecimenQuery.run(tx, {
                specimenId: spec.id,
              });
              // TODO: fix this
              // [
              //   {
              //     vcfs: [
              //       's3://umccr-10g-data-dev/HG00097/HG00097.hard-filtered.vcf.gz',
              //       's3://umccr-10g-data-dev/HG00097/HG00097.hard-filtered.vcf.gz.tbi'
              //     ]
              //   }
              // ]
              let vcf = undefined,
                index = undefined;
              if (r && r.length > 0) {
                if (r[0].vcfs && r[0].vcfs.length === 2) {
                  vcf = r[0].vcfs[0];
                  index = r[0].vcfs[1];
                }
              }

              if (
                await this.selectService.isSelectable(
                  applicationCoded as any,
                  vcf,
                  index,
                  cas as any,
                  pat as any,
                  spec as any
                )
              ) {
                resultSpecimens.push(e.uuid(spec.id));
              }
            }
          }
        }

        if (resultSpecimens.length > 0) {
          // get all the entries from the db corresponding to the specimens we chose
          const newResults = e.select(e.dataset.DatasetSpecimen, (ds) => ({
            filter: e.op(ds.id, "in", e.set(...resultSpecimens)),
          }));

          // we add those specimens that survived our consent logic into the selectSpecimens set
          const x = await e
            .update(e.job.SelectJob, (sj) => ({
              filter: e.op(sj.id, "=", e.uuid(jobId)),
              set: {
                selectedSpecimens: { "+=": newResults },
              },
            }))
            .run(tx);
        }

        // and we remove *all* the cases that we process as part of this batch from the todoQueue
        if (casesFromQueue.length > 0) {
          const doneCases = e.select(e.dataset.DatasetCase, (dc) => ({
            filter: e.op(
              dc.id,
              "in",
              e.set(...casesFromQueue.map((m) => e.uuid(m.id)))
            ),
          }));

          await e
            .update(e.job.SelectJob, (sj) => ({
              filter: e.op(sj.id, "=", e.uuid(jobId)),
              set: {
                // take off from the queue
                todoQueue: {
                  "-=": doneCases,
                },
                // append any new messages for the UI
                // TODO: make messages work
                // messages: e.op(sj.messages, "++", e.array(resultMessages)),
                // a crude calculation in the db of the percent done
                percentDone: e.cast(
                  e.int16,
                  e.math.floor(
                    e.op(
                      e.op(
                        e.op(
                          e.op(sj.initialTodoCount, "-", e.count(sj.todoQueue)),
                          "+",
                          casesFromQueue.length
                        ),
                        "*",
                        // so we actually don't want this percentDone to ever get us to 100%...
                        // that step is reserved for the final end job step
                        99.99
                      ),
                      "/",
                      sj.initialTodoCount
                    )
                  )
                ),
              },
            }))
            .run(tx);
        }
        processedCount += casesFromQueue.length;
        return casesFromQueue.length;
      });

      if (c === 0) break;
    }

    return processedCount;
  }

  /**
   * For a given release that involves a running 'select' job - finish
   * off the job.
   *
   * @param jobId
   * @param wasSuccessful
   * @param isCancellation
   */
  public async endSelectJob(
    jobId: string,
    wasSuccessful: boolean,
    isCancellation: boolean
  ): Promise<void> {
    // basically the gist here is we need to move the new results into the release - and close this job off
    await this.edgeDbClient.transaction(async (tx) => {
      const selectJobQuery = e
        .select(e.job.SelectJob, (j) => ({
          auditEntry: true,
          started: true,
          filter: e.op(j.id, "=", e.uuid(jobId)),
        }))
        .assert_single();

      const selectJob = await selectJobQuery.run(this.edgeDbClient);

      if (!selectJob) throw new Error("Job id passed in was not a Select Job");

      if (!isCancellation) {
        const selectJobReleaseQuery = e.select(selectJobQuery.forRelease);

        // selectSpecimens from the job move straight over into the release selectedSpecimens
        if (wasSuccessful) {
          await e
            .update(selectJobReleaseQuery, (rq) => ({
              set: {
                selectedSpecimens: selectJobQuery.selectedSpecimens,
              },
            }))
            .run(tx);
        }
      }

      await this.auditLogService.completeReleaseAuditEvent(
        tx,
        selectJob.auditEntry.id,
        isCancellation ? 4 : 0,
        selectJob.started,
        new Date(),
        { jobId: jobId }
      );

      await e
        .update(selectJobQuery, (sj) => ({
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
        isCancellation ? 4 : 0,
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

  /**
   * Return all the non-running jobs that have been associated with this release.
   *
   * @param releaseId
   */
  public async getPreviousJobs(releaseId: string) {
    return await e
      .select(e.job.Job, (sj) => ({
        filter: e.op(
          e.op(sj.status, "!=", e.job.JobStatus.running),
          "and",
          e.op(sj.forRelease.id, "=", e.uuid(releaseId))
        ),
      }))
      .run(this.edgeDbClient);
  }
}
