import "reflect-metadata";

import { parentPort } from "worker_threads";
import { JobsService } from "../src/business/services/jobs/jobs-base-service";
import { bootstrapDependencyInjection } from "../src/bootstrap-dependency-injection";
import { ElsaSettings } from "../src/config/elsa-settings";
import { sleep } from "edgedb/dist/utils";
import { workerData as breeWorkerData } from "node:worker_threads";
import { bootstrapSettings } from "../src/bootstrap-settings";
import { getDirectConfig } from "../src/config/config-schema";
import pino, { Logger } from "pino";
import { JobCloudFormationDeleteService } from "../src/business/services/jobs/job-cloud-formation-delete-service";
import { JobCloudFormationCreateService } from "../src/business/services/jobs/job-cloud-formation-create-service";
import { JobCopyOutService } from "../src/business/services/jobs/job-copy-out-service";
import { differenceInHours, minTime } from "date-fns";

// global settings for DI
const dc = bootstrapDependencyInjection();

(async () => {
  const settings = await bootstrapSettings(
    await getDirectConfig(breeWorkerData.job.worker.workerData)
  );

  // we create a logger that always has a field telling us that the context was the
  // job handler - allows us to separate out job logs in CloudWatch
  const logger = pino(settings.logger).child({ context: "job-handler" });

  dc.register<ElsaSettings>("Settings", {
    useValue: settings,
  });

  dc.register<Logger>("Logger", {
    useValue: logger,
  });

  // store boolean if the job handler is cancelled
  let isJobHandlerCancelled = false;

  let failureCount = 0;

  // handle cancellation
  if (parentPort)
    parentPort.on("message", (message) => {
      if (message === "cancel") isJobHandlerCancelled = true;
    });

  // this is a measure of the chunk size of work we want to do
  // it is roughly also the responsiveness measure for the queue - in general starting new jobs or cancelling
  // jobs will take about this amount of seconds before the signal is noticed
  const secondsChunk = 10;

  let lastEmptyInProgressMessageDateTime = minTime;

  while (true) {
    try {
      // moved here due to not sure we want a super long lived job service (AWS credentials??)
      const jobsService = dc.resolve(JobsService);
      const jobCloudFormationCreateService = dc.resolve(
        JobCloudFormationCreateService
      );
      const jobCloudFormationDeleteService = dc.resolve(
        JobCloudFormationDeleteService
      );
      const jobCopyOutService = dc.resolve(JobCopyOutService);

      const jobs = await jobsService.getInProgressJobs();

      if (!jobs || jobs.length < 1) {
        if (
          differenceInHours(Date.now(), lastEmptyInProgressMessageDateTime) > 0
        ) {
          logger.debug(
            `Check for in progress jobs resulted in empty set (this message occurs hourly even though checks are more frequent)`
          );
          lastEmptyInProgressMessageDateTime = Date.now();
        }
      } else {
        // we always want to log this if we have actual jobs in progress
        logger.debug(`Check for in progress jobs resulted in set ${jobs}`);

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
          logger.debug("JOB");
          logger.debug(j);

          if (j.requestedCancellation) {
            logger.info(
              `Cancelling job ${j.jobType} with id ${j.jobId} for release ${j.releaseKey}`
            );
          } else {
            logger.info(
              `Progressing job ${j.jobType} with id ${j.jobId} for release ${j.releaseKey}`
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
                jobCloudFormationCreateService
                  .doCloudFormationInstallJob(j.jobId)
                  .then((result) => {
                    if (result === 0)
                      return jobCloudFormationCreateService.endCloudFormationInstallJob(
                        j.jobId,
                        true,
                        false
                      );
                  })
              );
              break;

            case "CloudFormationDeleteJob":
              jobPromises.push(
                jobCloudFormationDeleteService
                  .doCloudFormationDeleteJob(j.jobId)
                  .then((result) => {
                    if (result === 0)
                      return jobCloudFormationDeleteService.endCloudFormationDeleteJob(
                        j.jobId,
                        true
                      );
                  })
              );
              break;

            case "CopyOutJob":
              jobPromises.push(
                jobCopyOutService.progressCopyOutJob(j.jobId).then((result) => {
                  if (result === 0)
                    return jobCopyOutService.endCopyOutJob(j.jobId, true);
                })
              );
              break;

            default:
              logger.error(`Unknown job type ${j.jobType}`);
          }
        }

        // we progress some work from each that wants work done
        const jobResults = await Promise.all(jobPromises);
      }

      await sleep(secondsChunk * 1000);

      logger.flush();

      // the only way we finish the job service is if the parent asks us
      if (isJobHandlerCancelled) {
        logger.warn(
          "JOB SERVICE FAILURE - RECEIVED PARENT CANCELLATION MESSAGE"
        );
        process.exit(0);
      }
    } catch (e) {
      // TODO replace with a better failure mechanism
      // if we hit 1000 failures then chances are we *are* just looping with failure and we probably do want to exit
      if (failureCount++ > 1000) {
        logger.fatal(
          e,
          "JOB SERVICE FAILURE - HIT FAILURE COUNT OF 1000 SO EXITING"
        );
        logger.flush();
        process.exit(0);
      } else {
        logger.error(e, "JOB SERVICE FAILURE - RESTARTING");
      }

      // make sure if we are looping that we aren't consuming *all* the CPU
      await sleep(60 * 1000);
    }
  }
})();
