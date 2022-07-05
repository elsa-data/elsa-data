import { Client, createClient } from "edgedb";
import { releasesService } from "../../src/business/services/releases-service";
import { AuthenticatedUser } from "../../src/business/authenticated-user";
import assert from "assert";
import {
  findCase,
  findDatabaseSpecimenIds,
  findPatient,
  findSpecimen,
} from "./utils";
import LinkHeader from "http-link-header";
import { ReleaseCaseType } from "@umccr/elsa-types";
import { PagedResult } from "../../src/api/api-pagination";
import { releasesAwsService } from "../../src/business/services/aws-service";
import { beforeEachCommon } from "./releases.common";
import { jobsService } from "../../src/business/services/jobs-service";

let edgeDbClient: Client;
let testReleaseId: string;

let allowedDataOwnerUser: AuthenticatedUser;
let allowedPiUser: AuthenticatedUser;
let notAllowedUser: AuthenticatedUser;

// because our 'select' job has a fake sleep in it - this tests runs long
jest.setTimeout(60000);

beforeEach(async () => {
  ({
    edgeDbClient,
    testReleaseId,
    allowedDataOwnerUser,
    allowedPiUser,
    notAllowedUser,
  } = await beforeEachCommon());
});

/**
 *
 */
it("jobs", async () => {
  const r = await jobsService.startSelectJob(
    allowedDataOwnerUser,
    testReleaseId
  );

  console.log(r);

  for (const j of await jobsService.getInProgressSelectJobs()) {
    console.log(`Rnd 1 found ${j}`);
    console.log(await jobsService.doSelectJobWork(j.id));
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

  console.log(JSON.stringify(result));
});
