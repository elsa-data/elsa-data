import * as edgedb from "edgedb";
import e, { dataset } from "../../../dbschema/edgeql-js";
import { AuthenticatedUser } from "../authenticated-user";
import { doRoleInReleaseCheck, getReleaseInfo } from "./releases-helper";
import { Base7807Error } from "../../api/errors/_error.types";
import { SelectJob } from "../../../dbschema/edgeql-js/modules/job";
import { sleep } from "edgedb/dist/utils";

class JobsService {
  private edgeDbClient = edgedb.createClient();

  /**
   * For a given release, start a background job identifying/selecting cases/patients/specimens
   * that should be included.
   *
   * @param user
   * @param releaseId
   */
  public async startSelectJob(
    user: AuthenticatedUser,
    releaseId: string
  ): Promise<void> {
    const { userRole } = await doRoleInReleaseCheck(user, releaseId);

    if (userRole != "DataOwner") {
      throw new Base7807Error(
        "Not authorised to start 'select' jobs for this release",
        400,
        `User is only a ${userRole} in this release`
      );
    }

    const { releaseAllDatasetCasesQuery } = await getReleaseInfo(
      this.edgeDbClient,
      releaseId
    );

    const newSelectJob = e.insert(e.job.SelectJob, {
      status: e.job.JobStatus.running,
      messages: e.literal(e.array(e.str), ["Starting"]),
      todoQueue: releaseAllDatasetCasesQuery,
      selectedSpecimens: e.set(),
    });

    await e
      .update(e.release.Release, (r) => ({
        set: {
          runningJob: newSelectJob,
        },
      }))
      .run(this.edgeDbClient);
  }

  public async getInProgressSelectJobs() {
    const jobsInProgress = await e
      .select(e.job.SelectJob, (sj) => ({
        id: true,
        release:
          e.job.SelectJob["<runningJob[is release::Release]"].assert_single(),
        filter: e.op(sj.status, "=", e.job.JobStatus.running),
      }))
      .run(this.edgeDbClient);

    return jobsInProgress.map((j) => ({
      id: j.id,
      releaseId: j.release!.id,
    }));
  }

  /**
   * Safely do a batch of work from the queue of work for the given
   * release.
   */
  public async doSelectJobWork(releaseId: string): Promise<boolean> {
    const batchSize = 3;

    const { releaseQuery } = await getReleaseInfo(this.edgeDbClient, releaseId);

    // we need to process jobs off the queue - create the corresponding results - and save the results
    // if any part of this fails we need to do done of it - hence the transaction
    const caseCount = await this.edgeDbClient.transaction(async (tx) => {
      const selectJobForRelease = e
        .select(releaseQuery.runningJob.is(SelectJob))
        .assert_single();

      // we are having some issues with the complexity of the runningJob.is(SelectedJob) when used
      // in an Update filter - so we also work out the job id so we can use that in our filters
      const jobId = (await selectJobForRelease.run(tx))?.id!;

      const casesFromQueue = await e
        .select(selectJobForRelease.todoQueue, (c) => ({
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
          limit: batchSize,
        }))
        .run(tx);

      const resultSpecimens: edgedb.reflection.$expr_Literal<
        edgedb.reflection.ScalarType<"std::uuid", string, true, string>
      >[] = [];

      for (const cas of casesFromQueue) {
        for (const ext of cas.externalIdentifiers || []) {
          // this is some fake logic only include SINGLETON cases
          if (ext.value.includes("SINGLE")) {
            // for singletons includes all the specimens
            for (const pat of cas.patients) {
              for (const spec of pat.specimens) {
                resultSpecimens.push(e.uuid(spec.id));

                // await sleep(15000);
              }
            }
          }
        }
      }

      if (resultSpecimens.length > 0) {
        const newResults = e.select(e.dataset.DatasetSpecimen, (ds) => ({
          filter: e.op(ds.id, "in", e.set(...resultSpecimens)),
        }));

        const x = await e
          .update(e.job.SelectJob, (sj) => ({
            filter: e.op(sj.id, "=", e.uuid(jobId)),
            set: {
              selectedSpecimens: { "+=": newResults },
            },
          }))
          .run(tx);

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
              todoQueue: { "-=": doneCases },
            },
          }))
          .run(tx);
      }

      return casesFromQueue.length;
    });

    return caseCount === 0;
  }

  /**
   * For a given release that involves a running 'select' job - finish
   * off the job.
   *
   * @param releaseId
   */
  public async endSelectJob(releaseId: string): Promise<void> {
    const { releaseQuery } = await getReleaseInfo(this.edgeDbClient, releaseId);

    // we need to move the new results into the release - and close this job off
    const caseCount = await this.edgeDbClient.transaction(async (tx) => {
      const selectJobForRelease = e
        .select(releaseQuery.runningJob.is(SelectJob))
        .assert_single();

      // we are having some issues with the complexity of the runningJob.is(SelectedJob) when used
      // in an Update filter - so we also work out the job id so we can use that in our filters
      const jobId = (await selectJobForRelease.run(tx))?.id!;

      await e
        .update(releaseQuery, (rq) => ({
          set: {
            selectedSpecimens: selectJobForRelease.selectedSpecimens,
            runningJob: null,
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
    return [];
  }
}

export const jobsService = new JobsService();
