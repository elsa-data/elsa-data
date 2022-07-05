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
it("get all case level information from a release as a data owner", async () => {
  const pagedResult = await releasesService.getCases(
    allowedDataOwnerUser,
    testReleaseId
  );

  expect(pagedResult).not.toBeNull();
  assert(pagedResult != null);

  // as the dataowner we will see everything
  // 10 cases from 10g and 2 cases from 10f
  expect(pagedResult.data.length).toBe(14);
  expect(pagedResult.total).toBe(14);

  expect(findSpecimen(pagedResult.data, "HG1")?.nodeStatus).toBe("selected");
  expect(findSpecimen(pagedResult.data, "HG2")?.nodeStatus).toBe("selected");
  expect(findSpecimen(pagedResult.data, "HG3")?.nodeStatus).toBe("unselected");
  expect(findSpecimen(pagedResult.data, "HG4")?.nodeStatus).toBe("unselected");

  // expect nothing in the duck family to be selected
  expect(findSpecimen(pagedResult.data, "HG90")?.nodeStatus).toBe("unselected");
  expect(findSpecimen(pagedResult.data, "HG91")?.nodeStatus).toBe("unselected");
});

/**
 *
 */
it("get limited case level information from a release as a PI", async () => {
  const pagedResult = await releasesService.getCases(
    allowedPiUser,
    testReleaseId
  );

  expect(pagedResult).not.toBeNull();
  assert(pagedResult != null);

  // as a PI we will only see cases that have _something_ selected in them
  expect(pagedResult.data.length).toBe(6);
  expect(pagedResult.total).toBe(6);

  // because the PI has no concept of 'unselected' item - every node present is selected
  expect(findCase(pagedResult.data, "SIMPSONS")?.nodeStatus).toBe("selected");
  expect(findCase(pagedResult.data, "JETSONS")?.nodeStatus).toBe("selected");

  // the specimens that are shared
  expect(findSpecimen(pagedResult.data, "HG1")?.nodeStatus).toBe("selected");
  expect(findSpecimen(pagedResult.data, "HG2")?.nodeStatus).toBe("selected");

  // not expecting to find these specimens at all as they are not shared
  expect(findSpecimen(pagedResult.data, "HG3")?.nodeStatus).toBeUndefined();
  expect(findSpecimen(pagedResult.data, "HG4")?.nodeStatus).toBeUndefined();
  expect(findSpecimen(pagedResult.data, "HG90")?.nodeStatus).toBeUndefined();
});

/**
 *
 */
it("get patient/specimen level data fields", async () => {
  const pagedResult = await releasesService.getCases(
    allowedDataOwnerUser,
    testReleaseId
  );

  expect(pagedResult).not.toBeNull();
  assert(pagedResult != null);

  const caseSimpsons = findCase(pagedResult.data, "SIMPSONS");
  const patientLisa = findPatient(pagedResult.data, "TRIOLISA");
  const patientHomer = findPatient(pagedResult.data, "TRIOHOMER");
  const patientMarge = findPatient(pagedResult.data, "TRIOMARGE");

  expect(patientLisa?.sexAtBirth).toBe("female");
  expect(patientHomer?.sexAtBirth).toBe("male");
  expect(patientMarge?.sexAtBirth).toBe("female");
});

/**
 *
 */
it("node status changes as leaves are selected and unselected", async () => {
  {
    const initialResult = await releasesService.getCases(
      allowedDataOwnerUser,
      testReleaseId
    );

    assert(initialResult != null);

    expect(findCase(initialResult.data, "SIMPSONS")?.nodeStatus).toBe(
      "indeterminate"
    );
    expect(findSpecimen(initialResult.data, "HG1")?.nodeStatus).toBe(
      "selected"
    );
    expect(findSpecimen(initialResult.data, "HG2")?.nodeStatus).toBe(
      "selected"
    );
    expect(findSpecimen(initialResult.data, "HG3")?.nodeStatus).toBe(
      "unselected"
    );
    expect(findCase(initialResult.data, "JETSONS")?.nodeStatus).toBe(
      "indeterminate"
    );
    expect(findSpecimen(initialResult.data, "HG4")?.nodeStatus).toBe(
      "unselected"
    );
    expect(findSpecimen(initialResult.data, "HG5")?.nodeStatus).toBe(
      "unselected"
    );
    expect(findSpecimen(initialResult.data, "HG6")?.nodeStatus).toBe(
      "selected"
    );
  }

  await releasesService.setSelected(
    allowedDataOwnerUser,
    testReleaseId,
    await findDatabaseSpecimenIds(edgeDbClient, ["HG00097", "HG4", "HG5"])
  );

  {
    const afterSetResult = await releasesService.getCases(
      allowedDataOwnerUser,
      testReleaseId
    );

    expect(afterSetResult).not.toBeNull();
    assert(afterSetResult != null);

    expect(findCase(afterSetResult.data, "SIMPSONS")?.nodeStatus).toBe(
      "indeterminate"
    );
    expect(findSpecimen(afterSetResult.data, "HG1")?.nodeStatus).toBe(
      "selected"
    );
    expect(findSpecimen(afterSetResult.data, "HG2")?.nodeStatus).toBe(
      "selected"
    );
    expect(findSpecimen(afterSetResult.data, "HG3")?.nodeStatus).toBe(
      "unselected"
    );
    // note this change which has occurred because the leaf node of HG4 and HG5 has changed
    expect(findCase(afterSetResult.data, "JETSONS")?.nodeStatus).toBe(
      "selected"
    );
    expect(findSpecimen(afterSetResult.data, "HG4")?.nodeStatus).toBe(
      "selected"
    );
    expect(findSpecimen(afterSetResult.data, "HG5")?.nodeStatus).toBe(
      "selected"
    );
    expect(findSpecimen(afterSetResult.data, "HG6")?.nodeStatus).toBe(
      "selected"
    );
  }

  await releasesService.setUnselected(
    allowedDataOwnerUser,
    testReleaseId,
    await findDatabaseSpecimenIds(edgeDbClient, ["HG1", "HG2"])
  );

  {
    const afterUnsetResult = await releasesService.getCases(
      allowedDataOwnerUser,
      testReleaseId
    );

    expect(afterUnsetResult).not.toBeNull();
    assert(afterUnsetResult != null);

    // note this change due to all the leaves now being unset
    expect(findCase(afterUnsetResult.data, "SIMPSONS")?.nodeStatus).toBe(
      "unselected"
    );
    expect(findSpecimen(afterUnsetResult.data, "HG1")?.nodeStatus).toBe(
      "unselected"
    );
    expect(findSpecimen(afterUnsetResult.data, "HG2")?.nodeStatus).toBe(
      "unselected"
    );
    expect(findSpecimen(afterUnsetResult.data, "HG3")?.nodeStatus).toBe(
      "unselected"
    );
  }
});

it("pass in specimen ids that are not valid", async () => {
  await expect(async () => {
    await releasesService.setSelected(
      allowedPiUser,
      testReleaseId,
      // whilst this looks vaguely like a edgedb id it will never match
      ["aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"]
    );
  }).rejects.toThrow(Error);

  // TODO: a slightly more difficult one where we pass in a valid specimen id - but the
  // specimen id belongs to a dataset not in our release
  //await expect(async () => {
  //  await releasesService.setSelected(
  //      allowedPiUser,
  //      testReleaseId,
  //       []
  //  );
  // }).rejects.toThrow(Error);
});

it("test paging", async () => {
  const allCasesFound: string[] = [];

  const limit = 3;

  let result: PagedResult<ReleaseCaseType> | null = null;

  do {
    result = await releasesService.getCases(
      allowedDataOwnerUser,
      testReleaseId,
      limit,
      result ? result.next : 0
    );

    expect(result).not.toBeNull();
    assert(result != null);

    expect(result.total).toBe(14);

    for (const c of result.data) {
      allCasesFound.push(c.id);
    }
  } while (result && result.next);

  // 10 cases from 10g and 4 cases from 10f
  expect(allCasesFound.length).toBe(14);
});
