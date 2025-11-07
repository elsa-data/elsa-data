import { differenceInSeconds } from "date-fns";
import * as gel from "gel";
import { Transaction } from "gel/dist/transaction";
import _ from "lodash";
import type { Logger } from "pino";
import { inject, injectable } from "tsyringe";
import e from "../../../../dbschema/edgeql-js";
import {
  releaseJobInsertCohortBuildJob,
  selectJobUpdateWorkChunk,
} from "../../../../dbschema/queries";
import {
  createPagedResult,
  type PagedResult,
} from "../../../api/helpers/pagination-helpers";
import { Base7807Error } from "../../../shared/error-types";
import type {
  ReleaseDetailType,
  ReleasePreviousJobType,
} from "../../../shared/schemas-releases";
import { AuthenticatedUser } from "../../authenticated-user";
import { AuditEventService } from "../audit-event-service";
import { collapseExternalIds } from "../helpers";
import { ReleaseService } from "../releases/release-service";
import { SelectService } from "../select-service";
import { jobAsType } from "./job-helpers";

export class NotAuthorisedToControlJob extends Base7807Error {
  constructor(userRole: string, releaseKey: string) {
    super(
      "Not authorised to control jobs for this release",
      403,
      `User is only a ${userRole} in the release ${releaseKey}`,
    );
  }
}

/**
 * The job service is responsible for coordinating database state with a
 * long-running background task that is responsible for progressing "jobs"
 * in small chunks.
 */
@injectable()
export class JobService {
  constructor(
    @inject("Database") protected readonly gelDbClient: gel.Client,
    @inject("Logger") protected readonly logger: Logger,
    @inject(AuditEventService)
    protected readonly auditLogService: AuditEventService,
    @inject(ReleaseService) protected readonly releaseService: ReleaseService,
    @inject(SelectService) protected readonly selectService: SelectService,
  ) {}

  /**
   * The internal mechanism for subclasses to generically
   * start a long-running job.
   *
   * @param releaseKey
   * @param finalJobStartStep
   * @protected
   */
  protected async startGenericJob(
    releaseKey: string,
    finalJobStartStep: (tx: Transaction) => Promise<void>,
  ) {
    await this.gelDbClient.transaction(async (tx) => {
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
            e.op(j.forRelease.releaseKey, "=", releaseKey),
          ),
        }))
        .run(tx);

      if (oldJob && oldJob.length > 0)
        throw new Base7807Error(
          "Only one running job is allowed per release",
          400,
          `Job with id(s) ${oldJob
            .map((oj) => oj.id)
            .join(" ")} have been found in the running state`,
        );

      await finalJobStartStep(tx);
    });
  }

  /**
   * Return the ids for any jobs that are currently in progress across
   * the *entire* system. This is the main
   * entry to the job system for our worker threads looking for work.
   */
  public async getInProgressJobs() {
    const jobsInProgress = await e
      .select(e.job.Job, (j) => ({
        __type__: { name: true },
        id: true,
        forRelease: { id: true, releaseKey: true },
        requestedCancellation: true,
        auditEntry: true,
        started: true,
        filter: e.op(j.status, "=", e.job.JobStatus.running),
      }))
      .run(this.gelDbClient);

    return jobsInProgress.map((j) => ({
      jobId: j.id,
      jobType: jobAsType(j),
      releaseKey: j.forRelease.releaseKey,
      auditEntryId: j.auditEntry.id,
      auditEntryStarted: j.started,
      requestedCancellation: j.requestedCancellation,
    }));
  }

  /**
   * For a given release, start a background job identifying/selecting cases/patients/specimens
   * that should be included. Returns the release information which will now have
   * a 'runningJob' field.
   *
   * @param user
   * @param releaseKey
   */
  public async startSelectJob(
    user: AuthenticatedUser,
    releaseKey: string,
  ): Promise<ReleaseDetailType> {
    const { userRole } =
      await this.releaseService.getBoundaryInfoWithThrowOnFailure(
        user,
        releaseKey,
      );

    if (userRole != "Administrator")
      throw new NotAuthorisedToControlJob(userRole, releaseKey);

    await this.startGenericJob(releaseKey, async (tx) => {
      // by placing the audit event in the transaction I guess we miss out on
      // the ability to audit jobs that don't start at all - but maybe we do that
      // some other way
      const newAuditEventId = await this.auditLogService.startReleaseAuditEvent(
        user,
        releaseKey,
        "E",
        "Ran Cohort Build",
        new Date(),
        tx,
      );

      await releaseJobInsertCohortBuildJob(tx, {
        releaseKey: releaseKey,
        alreadyInsertedAuditEntryId: newAuditEventId,
      });
    });

    // return the status of the release - which now has a runningJob
    return await this.releaseService.getBase(releaseKey, userRole);
  }

  public async cancelInProgressSelectJob(
    user: AuthenticatedUser,
    releaseKey: string,
  ): Promise<ReleaseDetailType> {
    const { userRole } =
      await this.releaseService.getBoundaryInfoWithThrowOnFailure(
        user,
        releaseKey,
      );

    if (userRole != "Administrator")
      throw new NotAuthorisedToControlJob(userRole, releaseKey);

    await this.gelDbClient.transaction(async (tx) => {
      const currentJob = await e
        .select(e.job.Job, (j) => ({
          id: true,
          filter: e.op(
            e.op(j.status, "=", e.job.JobStatus.running),
            "and",
            e.op(j.forRelease.releaseKey, "=", releaseKey),
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
    return await this.releaseService.getBase(releaseKey, userRole);
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
    roughlyMaxSeconds: number,
  ): Promise<number> {
    const selectJobQuery = e
      .select(e.job.SelectJob, (j) => ({
        filter: e.op(j.id, "=", e.uuid(jobId)),
      }))
      .assert_single();

    if (!(await selectJobQuery.run(this.gelDbClient)))
      throw new Error("Job id passed in was not a Select Job");

    const selectJobReleaseQuery = e.select(selectJobQuery.forRelease);

    const applicationCoded = await e
      .select(selectJobReleaseQuery.applicationCoded, (ac) => ({
        ...e.release.ApplicationCoded["*"],
      }))
      .run(this.gelDbClient);

    const startTime = new Date();
    let processedCount = 0;

    // we want our job processing to be 'time' focussed... so do work until we roughly hit the
    // maximum time allotted
    while (differenceInSeconds(startTime, new Date()) < 10) {
      // we need to process a job off the queue - create the corresponding result (if any) - and save the result
      // we do this transactionally so we can never miss an item
      const c = await this.gelDbClient.transaction(async (tx) => {
        const casesFromQueue = await e
          .select(selectJobQuery.todoQueue, (c) => ({
            ...e.dataset.DatasetCase["*"],
            dataset: {
              ...e.dataset.Dataset["*"],
              consent: {
                ...e.consent.Consent["*"],
                statements: () => ({
                  ...e.is(e.consent.ConsentStatementDynamicDuo, {
                    consentSystemIdentifier: true,
                  }),
                  ...e.is(e.consent.ConsentStatementDuo, {
                    dataUseLimitation: true,
                  }),
                }),
              },
            },
            consent: {
              ...e.consent.Consent["*"],
              statements: () => ({
                ...e.is(e.consent.ConsentStatementDynamicDuo, {
                  consentSystemIdentifier: true,
                }),
                ...e.is(e.consent.ConsentStatementDuo, {
                  dataUseLimitation: true,
                }),
              }),
            },
            patients: {
              consent: {
                ...e.consent.Consent["*"],
                statements: () => ({
                  ...e.is(e.consent.ConsentStatementDynamicDuo, {
                    consentSystemIdentifier: true,
                  }),
                  ...e.is(e.consent.ConsentStatementDuo, {
                    dataUseLimitation: true,
                  }),
                }),
              },
              ...e.dataset.DatasetPatient["*"],
              specimens: {
                ...e.dataset.DatasetSpecimen["*"],
                consent: {
                  ...e.consent.Consent["*"],
                  statements: () => ({
                    ...e.is(e.consent.ConsentStatementDynamicDuo, {
                      consentSystemIdentifier: true,
                    }),
                    ...e.is(e.consent.ConsentStatementDuo, {
                      dataUseLimitation: true,
                    }),
                  }),
                },
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
        const resultSpecimens: string[] = [];
        const resultMessages: string[] = [];

        for (const cas of casesFromQueue) {
          for (const pat of cas.patients || []) {
            for (const spec of pat.specimens || []) {
              let vcf = undefined,
                index = undefined;

              let testSelectable = false;

              try {
                testSelectable = await this.selectService.isSelectable(
                  applicationCoded as any,
                  vcf,
                  index,
                  cas as any,
                  pat as any,
                  spec as any,
                );
              } catch (e) {
                this.logger.error(
                  e,
                  "Uncaught exception during cohort building test so assuming false",
                );

                testSelectable = false;
              }

              if (testSelectable) {
                resultSpecimens.push(spec.id);
                resultMessages.push(
                  `In - ${collapseExternalIds(cas.externalIdentifiers)} ${collapseExternalIds(pat.externalIdentifiers)} ${collapseExternalIds(spec.externalIdentifiers)}`,
                );
              } else {
                resultMessages.push(
                  `Out - ${collapseExternalIds(cas.externalIdentifiers)} ${collapseExternalIds(pat.externalIdentifiers)} ${collapseExternalIds(spec.externalIdentifiers)}`,
                );
              }
            }
          }
        }

        await selectJobUpdateWorkChunk(tx, {
          jobId: jobId,
          newMessages: resultMessages,
          newSpecimens: resultSpecimens,
        });

        // and we remove *all* the cases that we process as part of this batch from the todoQueue
        if (casesFromQueue.length > 0) {
          const doneCases = e.select(e.dataset.DatasetCase, (dc) => ({
            filter: e.op(
              dc.id,
              "in",
              e.set(...casesFromQueue.map((m) => e.uuid(m.id))),
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
                          casesFromQueue.length,
                        ),
                        "*",
                        // so we actually don't want this percentDone to ever get us to 100%...
                        // that step is reserved for the final end job step
                        99.99,
                      ),
                      "/",
                      sj.initialTodoCount,
                    ),
                  ),
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
    isCancellation: boolean,
  ): Promise<void> {
    // basically the gist here is we need to move the new results into the release - and close this job off
    await this.gelDbClient.transaction(async (tx) => {
      const selectJobQuery = e
        .select(e.job.SelectJob, (j) => ({
          auditEntry: true,
          started: true,
          filter: e.op(j.id, "=", e.uuid(jobId)),
        }))
        .assert_single();

      const selectJob = await selectJobQuery.run(this.gelDbClient);

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
        selectJob.auditEntry.id,
        isCancellation ? 4 : 0,
        selectJob.started,
        new Date(),
        { jobId: jobId },
        tx,
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

  /**
   * Return all the non-running jobs that have been associated with this release.
   *
   * @param user
   * @param releaseKey
   * @param limit
   * @param offset
   */
  public async getPreviousJobs(
    user: AuthenticatedUser,
    releaseKey: string,
    limit: number,
    offset: number,
  ): Promise<PagedResult<ReleasePreviousJobType>> {
    const { userRole, isAllowedOverallAdministratorView } =
      await this.releaseService.getBoundaryInfoWithThrowOnFailure(
        user,
        releaseKey,
      );

    if (userRole != "Administrator" && !isAllowedOverallAdministratorView)
      throw new NotAuthorisedToControlJob(userRole, releaseKey);

    const pageOfEntriesQueryFn = (params?: { offset: number; limit: number }) =>
      e.select(e.job.Job, (sj) => ({
        id: true,
        __type__: { name: true },
        created: true,
        started: true,
        ended: true,
        requestedCancellation: true,
        messages: true,
        ...e.is(e.job.CloudFormationInstallJob, {
          s3HttpsUrl: true,
          awsStackId: true,
        }),
        ...e.is(e.job.CloudFormationDeleteJob, {
          awsStackId: true,
        }),
        ...e.is(e.job.CopyOutJob, {
          awsExecutionArn: true,
        }),
        filter: e.op(
          e.op(sj.status, "!=", e.job.JobStatus.running),
          "and",
          e.op(sj.forRelease.releaseKey, "=", releaseKey),
        ),
        order_by: [
          {
            expression: sj.started,
            direction: e.DESC,
          },
        ],
        ...params,
      }));

    const countQuery = e.count(pageOfEntriesQueryFn());
    const pageOfEntriesQuery = pageOfEntriesQueryFn({ limit, offset });

    const totalEntries = await countQuery.run(this.gelDbClient);
    const pageOfEntries = await pageOfEntriesQuery.run(this.gelDbClient);

    return createPagedResult(
      pageOfEntries.map((entry) => ({
        objectId: entry.id,
        type: entry.__type__.name.split("::").at(-1) ?? "",
        created: entry.created.toISOString(),
        started: entry.started.toISOString(),
        ended: entry.ended?.toISOString(),
        requestedCancellation: entry.requestedCancellation,
        details: JSON.stringify(
          _(entry)
            .pickBy((v, k) => v !== null)
            .omit([
              "__type__",
              "created",
              "ended",
              "id",
              "messages",
              "requestedCancellation",
              "started",
            ])
            .merge({
              messages: entry.messages.join("\n"),
            })
            .value(),
          null,
          2,
        ),
      })),
      totalEntries,
    );
  }
}
