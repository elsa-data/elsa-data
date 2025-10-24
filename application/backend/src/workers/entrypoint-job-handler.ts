import { differenceInHours, minTime } from "date-fns";
import { JobCloudFormationCreateService } from "../business/services/jobs/job-cloud-formation-create-service";
import { JobCloudFormationDeleteService } from "../business/services/jobs/job-cloud-formation-delete-service";
import { JobCopyOutService } from "../business/services/jobs/job-copy-out-service";
import { JobService } from "../business/services/jobs/job-service";
import {
  setupWorkerFromConfigJson,
  sleepMicroseconds,
} from "./worker-bootstrap";

declare var self: Worker;

// top-level boolean if the job handler is cancelled
let isJobHandlerCancelled = false;

self.onmessage = (event: MessageEvent) => {
  // handle cancellation (CURRENTLY DISABLED WITH BUN - NEVER TRIGGERED)
  if (typeof event.data === "string") {
    if (event.data === "cancel") isJobHandlerCancelled = true;
  } else {
    return jobHandler(event.data);
  }
};

/**
 * Job handler is an endless loop that periodically polls for jobs in the database, and if
 * they exist it will "progress" the work for them and update the database state.
 *
 * @param configJson the configuration object as plain JSON
 */
async function jobHandler(configJson: any) {
  const { dc, logger } = await setupWorkerFromConfigJson(
    configJson,
    "job-handler",
  );

  let failureCount = 0;

  // this is a measure of the chunk size of work we want to do
  // it is roughly also the responsiveness measure for the queue - in general starting new jobs or cancelling
  // jobs will take about this amount of seconds before the signal is noticed
  const secondsChunk = 10;

  let lastEmptyInProgressMessageDateTime = minTime;

  // @ts-ignore: 'while' statement cannot complete without throwing an exception
  while (true) {
    try {
      // moved here due to not sure we want a super long lived job service (AWS credentials??)
      // so yes - we re-create the services each loop
      const jobService = dc.resolve(JobService);
      const jobCloudFormationCreateService = dc.resolve(
        JobCloudFormationCreateService,
      );
      const jobCloudFormationDeleteService = dc.resolve(
        JobCloudFormationDeleteService,
      );
      const jobCopyOutService = dc.resolve(JobCopyOutService);

      // the database has our state of active jobs
      const jobs = await jobService.getInProgressJobs();

      if (!jobs || jobs.length < 1) {
        if (
          differenceInHours(Date.now(), lastEmptyInProgressMessageDateTime) > 0
        ) {
          logger.debug(
            `Check for in progress jobs resulted in empty set (this message occurs hourly even though checks are more frequent)`,
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
        // one 'made up' job will just sleepMicroseconds for 10 seconds

        const jobPromises: Promise<void>[] = [];

        // at least one job needs to 'take time' or else we could busy wait if an active job is just polling
        jobPromises.push(sleepMicroseconds(secondsChunk * 1000));

        for (const j of jobs) {
          logger.debug("JOB");
          logger.debug(j);

          if (j.requestedCancellation) {
            logger.info(
              `Cancelling job ${j.jobType} with id ${j.jobId} for release ${j.releaseKey}`,
            );
          } else {
            logger.info(
              `Progressing job ${j.jobType} with id ${j.jobId} for release ${j.releaseKey}`,
            );
          }

          // there is probably a nice OO pattern that could come out of these (quite) similar
          // job calls - but for the moment we leave the flexibility to structure each job
          // independently

          switch (j.jobType) {
            case "SelectJob":
              if (j.requestedCancellation)
                jobPromises.push(jobService.endSelectJob(j.jobId, false, true));
              else
                jobPromises.push(
                  jobService
                    .doSelectJobWork(j.jobId, secondsChunk)
                    .then((result) => {
                      if (result === 0)
                        return jobService.endSelectJob(j.jobId, true, false);
                    }),
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
                        false,
                      );
                  }),
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
                        true,
                      );
                  }),
              );
              break;

            case "CopyOutJob":
              jobPromises.push(
                jobCopyOutService.progressCopyOutJob(j.jobId).then((result) => {
                  if (result === 0)
                    return jobCopyOutService.endCopyOutJob(j.jobId, true);
                }),
              );
              break;

            default:
              logger.error(`Unknown job type ${j.jobType}`);
          }
        }

        // we progress some work from each that wants work done
        const jobResults = await Promise.all(jobPromises);
      }

      await sleepMicroseconds(secondsChunk * 1000);

      logger.flush();

      // the only way we finish the job service is if the parent asks us
      if (isJobHandlerCancelled) {
        logger.warn(
          "JOB SERVICE FAILURE - RECEIVED PARENT CANCELLATION MESSAGE",
        );
        process.exit(0);
      }
    } catch (e) {
      // TODO replace with a better failure mechanism
      // if we hit 1000 failures then chances are we *are* just looping with failure and we probably do want to exit
      if (failureCount++ > 1000) {
        logger.fatal(
          e,
          "JOB SERVICE FAILURE - HIT FAILURE COUNT OF 1000 SO EXITING",
        );
        logger.flush();
        process.exit(0);
      } else {
        logger.error(e, "JOB SERVICE FAILURE - RESTARTING");
      }

      // make sure *if* we are busy looping (we shouldn't be - but if somehow we are) that we aren't consuming *all* the CPU
      await sleepMicroseconds(60 * 1000);
    }
  }
}
