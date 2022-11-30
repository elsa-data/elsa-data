import "reflect-metadata";

import { parentPort } from "worker_threads";
import { container } from "tsyringe";
import { JobsService } from "../src/business/services/jobs/jobs-base-service";
import { bootstrapDependencyInjection } from "../src/bootstrap-dependency-injection";
import { ElsaSettings } from "../src/config/elsa-settings";
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

  let failureCount = 0;

  // handle cancellation
  if (parentPort)
    parentPort.on("message", (message) => {
      if (message === "cancel") isCancelled = true;
    });

  // this is a measure of the chunk size of work we want to do
  // it is roughly also the responsiveness measure for the queue - in general starting new jobs or cancelling
  // jobs will take about this amount of seconds before the signal is noticed
  const secondsChunk = 10;

  while (true) {
    try {
      // moved here due to not sure we want a super long lived job service (AWS credentials??)
      const jobsService = container.resolve(JobsService);

      const jobs = await jobsService.getInProgressJobs();

      if (jobs && jobs.length > 0) {
        // our jobs will be a mixture of 'compute' and 'io'.. what we want to do is structure them
        // into small chunks of work (be that compute or io)
        // we then ask each job to progress its work...
        // some of these work items will go for 10ish seconds
        // some will just poll as they are waiting on external activity
        // one 'made up' job will just sleep for 10 seconds

        const jobPromises: Promise<void>[] = [];

        // at least one job needs to 'take time' or else we could busy wait if an active job is just polling
        jobPromises.push(sleep(secondsChunk * 1000));

        for (const j of jobs) {
          console.log("JOB");
          console.log(j);

          if (j.requestedCancellation) {
            console.log(
              `Cancelling job ${j.jobType} with id ${j.jobId} for release ${j.releaseId}`
            );
          } else {
            console.log(
              `Progressing job ${j.jobType} with id ${j.jobId} for release ${j.releaseId}`
            );
          }

          // there is probably a nice OO pattern that could come out of these (quite) similar
          // job calls - but for the moment we leave the flexibility to structure each job
          // independently

          switch (j.jobType) {
            case "SelectJob":
              if (j.requestedCancellation)
                jobPromises.push(
                  jobsService.endSelectJob(j.jobId, false, true)
                );
              else
                jobPromises.push(
                  jobsService
                    .doSelectJobWork(j.jobId, secondsChunk)
                    .then((result) => {
                      if (result === 0)
                        return jobsService.endSelectJob(j.jobId, true, false);
                    })
                );
              break;

            case "CloudFormationInstallJob":
              jobPromises.push(
                jobsService
                  .doCloudFormationInstallJob(j.jobId)
                  .then((result) => {
                    if (result === 0)
                      return jobsService.endCloudFormationInstallJob(
                        j.jobId,
                        true,
                        false
                      );
                  })
              );
              break;

            case "CloudFormationDeleteJob":
              break;

            default:
              console.error(`Unknown job type ${j.jobType}`);
          }
        }

        // we progress some work from each that wants work done
        const jobResults = await Promise.all(jobPromises);
      } else {
        await sleep(secondsChunk * 1000);
      }

      // the only way we finish the job service is if the parent asks us
      if (isCancelled) process.exit(0);
    } catch (e) {
      console.error("JOB SERVICE FAILED");
      console.error(e);

      // TODO replace with a better failure mechanism
      // if we hit 1000 failures then chances are we *are* just looping with failure
      if (failureCount++ > 1000) {
        process.exit(0);
      }

      // make sure if we are looping that we aren't consuming *all* the CPU
      await sleep(60 * 1000);
    }
  }
})();
