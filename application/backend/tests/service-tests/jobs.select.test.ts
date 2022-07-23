import { Client } from "edgedb";
import { AuthenticatedUser } from "../../src/business/authenticated-user";
import { ReleaseCaseType } from "@umccr/elsa-types";
import { PagedResult } from "../../src/api/api-pagination";
import { beforeEachCommon } from "./releases.common";
import { registerTypes } from "./setup";
import { ReleasesService } from "../../src/business/services/releases-service";
import { JobsService } from "../../src/business/services/jobs-service";

const testContainer = registerTypes();

const releasesService = testContainer.resolve(ReleasesService);
const jobsService = testContainer.resolve(JobsService);
const edgeDbClient = testContainer.resolve<Client>("Database");

let testReleaseId: string;

let allowedDataOwnerUser: AuthenticatedUser;
let allowedPiUser: AuthenticatedUser;
let notAllowedUser: AuthenticatedUser;

const DEFAULT_ROUGH_SECONDS = 10;

// because our 'select' job has a fake sleep in it - this tests runs long
jest.setTimeout(60000);

beforeEach(async () => {
  ({ testReleaseId, allowedDataOwnerUser, allowedPiUser, notAllowedUser } =
    await beforeEachCommon());
});

/**
 *
 */
it("jobs", async () => {
  /*const r = await jobsService.startSelectJob(
    allowedDataOwnerUser,
    testReleaseId
  );


  console.log(r);

  for (const j of await jobsService.getInProgressSelectJobs()) {
    console.log(`Rnd 1 found ${j}`);
    console.log(await jobsService.doSelectJobWork(j.id, DEFAULT_ROUGH_SECONDS));
  }

  for (const j of await jobsService.getInProgressSelectJobs()) {
    console.log(`Rnd 2 found ${j}`);
    console.log(await jobsService.doSelectJobWork(j.id));
  }

  for (const j of await jobsService.getInProgressSelectJobs()) {
    console.log(`Rnd 3 found ${j}`);
    console.log(await jobsService.doSelectJobWork(j.id));
  }

  for (const j of await jobsService.getInProgressSelectJobs()) {
    console.log(await jobsService.doSelectJobWork(j.id));
  }

  for (const j of await jobsService.getInProgressSelectJobs()) {
    console.log(await jobsService.doSelectJobWork(j.id));
  }

  const e = await jobsService.endSelectJob(testReleaseId, true);

  let result: PagedResult<ReleaseCaseType> | null = null;

  result = await releasesService.getCases(allowedPiUser, testReleaseId, 100, 0);

  console.log(JSON.stringify(result)); */
});
