import * as edgedb from "edgedb";
import e, { dataset, release } from "../dbschema/edgeql-js";
import { parentPort } from "worker_threads";
import { jobsService } from "../src/business/services/jobs";

// store boolean if the job is cancelled
let isCancelled = false;

// handle cancellation (this is a very simple example)
if (parentPort)
  parentPort.once("message", (message) => {
    if (message === "cancel") isCancelled = true;
  });

(async () => {
  const jobs = await jobsService.getInProgressSelectJobs();

  // we progress a batch from each job
  const jobResults = await Promise.all(
    jobs.map((job) => {
      return jobsService.doSelectJobWork(job.releaseId);
    })
  );

  for (let i = 0; i < jobResults.length; i++) {
    if (!jobResults[i]) await jobsService.endSelectJob(jobs[i].releaseId);
  }

  // signal to parent that the job is done
  if (parentPort) parentPort.postMessage("done");
  else process.exit(0);
})();
