import "reflect-metadata";

import { parentPort } from "worker_threads";
import { container } from "tsyringe";
import { JobsService } from "../src/business/services/jobs/jobs-base-service";
import { bootstrapDependencyInjection } from "../src/bootstrap-dependency-injection";
import { ElsaSettings } from "../src/config/elsa-settings";
import { Issuer } from "openid-client";
import { sleep } from "edgedb/dist/utils";
import {
  Worker,
  isMainThread,
  workerData as breeWorkerData,
} from "node:worker_threads";
import { bootstrapSettings } from "../src/bootstrap-settings";
import { getDirectConfig } from "../src/config/config-schema";

// global settings for DI
bootstrapDependencyInjection();

(async () => {
  container.register<ElsaSettings>("Settings", {
    useValue: await bootstrapSettings(
      await getDirectConfig(breeWorkerData.job.worker.workerData)
    ),
  });

  // store boolean if the job is cancelled
  let isCancelled = false;

  // handle cancellation
  if (parentPort)
    parentPort.on("message", (message) => {
      if (message === "cancel") isCancelled = true;
    });

  const jobsService = container.resolve(JobsService);

  while (true) {
    const jobs = await jobsService.getInProgressJobs();

    if (jobs && jobs.length > 0) {
      // our jobs are in two different camps
      //const wantsCancelling = jobs.filter((job) => job.requestedCancellation);
      const wantsWorking = jobs.filter((job) => !job.requestedCancellation);

      // first we cancel any that have indicated they want to be cancelled
      /*{
        const cancelResults = await Promise.all(
          wantsCancelling.map((job) => {
            return jobsService.endSelectJob(job.jobId, false, true);
          })
        );
      } */

      // progress all the jobs by at least 10 seconds
      const jobPromises: Promise<void>[] = [];

      // at least one job needs to 'take time' or else we could busy wait if an active job is just polling
      jobPromises.push(sleep(5000));

      for (const j of jobs) {
        console.log("JOB");
        console.log(j);

        if (j.isSelectJob && false) {
          console.log(
            `Progressing select job with id ${j.jobId} for release ${j.releaseId}`
          );
          jobPromises.push(
            jobsService.doSelectJobWork(j.jobId, 10).then((result) => {
              if (result === 0)
                return jobsService.endSelectJob(j.jobId, true, false);
            })
          );
        }
        if (j.isCloudFormationInstallJob) {
          console.log(
            `Progressing cloud formation install job with id ${j.jobId} for release ${j.releaseId}`
          );
          jobPromises.push(
            jobsService.doCloudFormationInstallJob(j.jobId).then((result) => {
              console.log(result);
            })
          );
        }
      }

      // we progress some work from each that wants work done
      const jobResults = await Promise.all(jobPromises);
    } else {
      await sleep(5000);
    }

    if (isCancelled) process.exit(0);
  }

  // signal to parent that the job is done
  //if (parentPort) parentPort.postMessage("done");
  //else process.exit(0);
})();
