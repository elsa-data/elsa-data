import "reflect-metadata";

import { parentPort } from "worker_threads";
import { container } from "tsyringe";
import { JobsService } from "../src/business/services/jobs-service";
import { bootstrapDependencyInjection } from "../src/bootstrap-dependency-injection";
import { ElsaSettings } from "../src/config/elsa-settings";
import { Issuer } from "openid-client";

// global settings for DI
bootstrapDependencyInjection();

// we need to work out what we are going to do here in the workers for establishing configuration
// for the moment we seem to be fine because none of the services used in the worker needs
// settings
const fakeSettings: ElsaSettings = {
  deployedUrl: "localhost",
  remsBotKey: "",
  remsUrl: "",
  sessionSalt: "",
  sessionSecret: "",
  remsBotUser: "",
  awsSigningAccessKeyId: "",
  awsSigningSecretAccessKey: "",
  oidcClientId: "",
  oidcClientSecret: "",
  oidcIssuer: new Issuer({ issuer: "" }),
  ontoFhirUrl: "",
  host: "127.0.0.1",
  port: 3000,
  datasets: [],
  superAdmins: [],
  rateLimit: {},
};

container.register<ElsaSettings>("Settings", {
  useValue: fakeSettings,
});

// store boolean if the job is cancelled
let isCancelled = false;

// handle cancellation (this is a very simple example)
if (parentPort)
  parentPort.once("message", (message) => {
    if (message === "cancel") isCancelled = true;
  });

(async () => {
  const jobsService = container.resolve(JobsService);

  const jobs = await jobsService.getInProgressSelectJobs();

  if (jobs) {
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
    console.log("No running select jobs to process");
  }

  // signal to parent that the job is done
  if (parentPort) parentPort.postMessage("done");
  else process.exit(0);
})();
