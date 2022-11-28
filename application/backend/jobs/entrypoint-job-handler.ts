import "reflect-metadata";

import { parentPort } from "worker_threads";
import { container } from "tsyringe";
import { JobsService } from "../src/business/services/jobs-service";
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
      console.log(`Found ${jobs.length} running select jobs to process`);

      // our jobs are in two different camps
      const wantsCancelling = jobs.filter((job) => job.requestedCancellation);
      const wantsWorking = jobs.filter((job) => !job.requestedCancellation);

      // first we cancel any that have indicated they want to be cancelled
      {
        const cancelResults = await Promise.all(
          wantsCancelling.map((job) => {
            return jobsService.endSelectJob(job.jobId, false, true);
          })
        );
      }

      // otherwise we progress some work from each that wants work done
      {
        const jobResults = await Promise.all(
          wantsWorking.map((job) => jobsService.doSelectJobWork(job.jobId, 10))
        );

        // TODO: better error handling logic here.. at the moment we finish whenever we process 0
        // but we need to understand our errors better (transient no access to CTRL etc)

        for (let i = 0; i < jobResults.length; i++) {
          if (!jobResults[i]) {
            await jobsService.endSelectJob(jobs[i].jobId, true, false);
          }
        }
      }
    } else {
      await sleep(5000);
    }

    if (isCancelled) process.exit(0);
  }

  // signal to parent that the job is done
  //if (parentPort) parentPort.postMessage("done");
  //else process.exit(0);
})();
