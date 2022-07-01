import { Client, createClient } from "edgedb";
import { releasesService } from "../../src/business/services/releases";
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
import { releasesAwsService } from "../../src/business/services/releases-aws";
import { beforeEachCommon } from "./releases.common";
import { jobsService } from "../../src/business/services/jobs";

let edgeDbClient: Client;
let testReleaseId: string;

let allowedDataOwnerUser: AuthenticatedUser;
let allowedPiUser: AuthenticatedUser;
let notAllowedUser: AuthenticatedUser;

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

  for (const j of await jobsService.getInProgressSelectJobs()) {
    await jobsService.doSelectJobWork(j.releaseId);
  }

  for (const j of await jobsService.getInProgressSelectJobs()) {
    await jobsService.doSelectJobWork(j.releaseId);
  }

  for (const j of await jobsService.getInProgressSelectJobs()) {
    console.log(await jobsService.doSelectJobWork(j.releaseId));
  }

  for (const j of await jobsService.getInProgressSelectJobs()) {
    console.log(await jobsService.doSelectJobWork(j.releaseId));
  }

  for (const j of await jobsService.getInProgressSelectJobs()) {
    console.log(await jobsService.doSelectJobWork(j.releaseId));
  }

  const e = await jobsService.endSelectJob(testReleaseId);

  let result: PagedResult<ReleaseCaseType> | null = null;

  result = await releasesService.getCases(allowedPiUser, testReleaseId, 100, 0);

  console.log(JSON.stringify(result));
});
