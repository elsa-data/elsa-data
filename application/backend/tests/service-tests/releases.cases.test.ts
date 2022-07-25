import { AuthenticatedUser } from "../../src/business/authenticated-user";
import assert from "assert";
import {
  findCase,
  findDatabaseSpecimenIds,
  findPatient,
  findPatientExpected,
  findSpecimen,
} from "./utils";
import { ReleaseCaseType } from "@umccr/elsa-types";
import { PagedResult } from "../../src/api/api-pagination";
import { beforeEachCommon } from "./releases.common";
import { registerTypes } from "./setup";
import { ReleaseService } from "../../src/business/services/release-service";
import { Client } from "edgedb";
import {
  BART_PATIENT_PGP,
  BART_SPECIMEN,
  ELROY_SPECIMEN,
  GEORGE_SPECIMEN,
  HOMER_PATIENT_PGP,
  HOMER_SPECIMEN,
  JETSONS_CASE,
  JUDY_SPECIMEN,
  MARGE_PATIENT_PGP,
  MARGE_SPECIMEN,
  SIMPSONS_CASE,
} from "../../src/test-data/insert-test-data-10f";

const testContainer = registerTypes();

const edgeDbClient = testContainer.resolve<Client>("Database");
const releasesService = testContainer.resolve(ReleaseService);

let testReleaseId: string;

let allowedDataOwnerUser: AuthenticatedUser;
let allowedPiUser: AuthenticatedUser;
let notAllowedUser: AuthenticatedUser;

const DEFAULT_LIMIT = 10000;
const DEFAULT_OFFSET = 0;

beforeEach(async () => {
  testContainer.clearInstances();

  ({ testReleaseId, allowedDataOwnerUser, allowedPiUser, notAllowedUser } =
    await beforeEachCommon());
});

/**
 *
 */
it("get all case level information from a release as a data owner", async () => {
  const pagedResult = await releasesService.getCases(
    allowedDataOwnerUser,
    testReleaseId,
    DEFAULT_LIMIT,
    DEFAULT_OFFSET
  );

  expect(pagedResult).not.toBeNull();
  assert(pagedResult != null);

  // as the dataowner we will see everything
  // 10 cases from 10g and 2 cases from 10f
  expect(pagedResult.data.length).toBe(14);

  expect(findSpecimen(pagedResult.data, BART_SPECIMEN)?.nodeStatus).toBe(
    "selected"
  );
  expect(findSpecimen(pagedResult.data, HOMER_SPECIMEN)?.nodeStatus).toBe(
    "selected"
  );
  expect(findSpecimen(pagedResult.data, MARGE_SPECIMEN)?.nodeStatus).toBe(
    "unselected"
  );
  expect(findSpecimen(pagedResult.data, ELROY_SPECIMEN)?.nodeStatus).toBe(
    "unselected"
  );
  expect(findSpecimen(pagedResult.data, JUDY_SPECIMEN)?.nodeStatus).toBe(
    "selected"
  );

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
    testReleaseId,
    DEFAULT_LIMIT,
    DEFAULT_OFFSET
  );

  expect(pagedResult).not.toBeNull();
  assert(pagedResult != null);

  // as a PI we will only see cases that have _something_ selected in them
  expect(pagedResult.data.length).toBe(6);

  // because the PI has no concept of 'unselected' item - every node present is selected
  expect(findCase(pagedResult.data, SIMPSONS_CASE)?.nodeStatus).toBe(
    "selected"
  );
  expect(findCase(pagedResult.data, JETSONS_CASE)?.nodeStatus).toBe("selected");

  // the specimens that are shared
  expect(findSpecimen(pagedResult.data, BART_SPECIMEN)?.nodeStatus).toBe(
    "selected"
  );
  expect(findSpecimen(pagedResult.data, JUDY_SPECIMEN)?.nodeStatus).toBe(
    "selected"
  );

  // not expecting to find these specimens at all as they are not shared
  expect(
    findSpecimen(pagedResult.data, MARGE_SPECIMEN)?.nodeStatus
  ).toBeUndefined();
  expect(
    findSpecimen(pagedResult.data, ELROY_SPECIMEN)?.nodeStatus
  ).toBeUndefined();
  expect(findSpecimen(pagedResult.data, "HG90")?.nodeStatus).toBeUndefined();
});

/**
 *
 */
it("get patient/specimen level data fields", async () => {
  const pagedResult = await releasesService.getCases(
    allowedDataOwnerUser,
    testReleaseId,
    DEFAULT_LIMIT,
    DEFAULT_OFFSET
  );

  expect(pagedResult).not.toBeNull();
  assert(pagedResult != null);

  const caseSimpsons = findCase(pagedResult.data, SIMPSONS_CASE);
  const patientBart = findPatientExpected(pagedResult.data, "BART");
  const patientHomer = findPatientExpected(pagedResult.data, "HOMER");
  const patientMarge = findPatientExpected(pagedResult.data, "MARGE");

  expect(patientBart?.sexAtBirth).toBe("male");
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
      testReleaseId,
      DEFAULT_LIMIT,
      DEFAULT_OFFSET
    );

    assert(initialResult != null);

    expect(findCase(initialResult.data, SIMPSONS_CASE)?.nodeStatus).toBe(
      "indeterminate"
    );
    expect(findSpecimen(initialResult.data, BART_SPECIMEN)?.nodeStatus).toBe(
      "selected"
    );
    expect(findSpecimen(initialResult.data, HOMER_SPECIMEN)?.nodeStatus).toBe(
      "selected"
    );
    expect(findSpecimen(initialResult.data, MARGE_SPECIMEN)?.nodeStatus).toBe(
      "unselected"
    );
    expect(findCase(initialResult.data, JETSONS_CASE)?.nodeStatus).toBe(
      "indeterminate"
    );
    expect(findSpecimen(initialResult.data, ELROY_SPECIMEN)?.nodeStatus).toBe(
      "unselected"
    );
    expect(findSpecimen(initialResult.data, GEORGE_SPECIMEN)?.nodeStatus).toBe(
      "unselected"
    );
    expect(findSpecimen(initialResult.data, JUDY_SPECIMEN)?.nodeStatus).toBe(
      "selected"
    );
  }

  await releasesService.setSelected(
    allowedDataOwnerUser,
    testReleaseId,
    await findDatabaseSpecimenIds(edgeDbClient, [
      "HG00097",
      ELROY_SPECIMEN,
      GEORGE_SPECIMEN,
    ])
  );

  {
    const afterSetResult = await releasesService.getCases(
      allowedDataOwnerUser,
      testReleaseId,
      DEFAULT_LIMIT,
      DEFAULT_OFFSET
    );

    expect(afterSetResult).not.toBeNull();
    assert(afterSetResult != null);

    expect(findCase(afterSetResult.data, "SIMPSONS")?.nodeStatus).toBe(
      "indeterminate"
    );
    expect(findSpecimen(afterSetResult.data, BART_SPECIMEN)?.nodeStatus).toBe(
      "selected"
    );
    expect(findSpecimen(afterSetResult.data, HOMER_SPECIMEN)?.nodeStatus).toBe(
      "selected"
    );
    expect(findSpecimen(afterSetResult.data, MARGE_SPECIMEN)?.nodeStatus).toBe(
      "unselected"
    );
    // note this change which has occurred because the leaf node of HG4 and HG5 has changed
    expect(findCase(afterSetResult.data, "JETSONS")?.nodeStatus).toBe(
      "selected"
    );
    expect(findSpecimen(afterSetResult.data, ELROY_SPECIMEN)?.nodeStatus).toBe(
      "selected"
    );
    expect(findSpecimen(afterSetResult.data, GEORGE_SPECIMEN)?.nodeStatus).toBe(
      "selected"
    );
    expect(findSpecimen(afterSetResult.data, JUDY_SPECIMEN)?.nodeStatus).toBe(
      "selected"
    );
  }

  await releasesService.setUnselected(
    allowedDataOwnerUser,
    testReleaseId,
    await findDatabaseSpecimenIds(edgeDbClient, [BART_SPECIMEN, HOMER_SPECIMEN])
  );

  {
    const afterUnsetResult = await releasesService.getCases(
      allowedDataOwnerUser,
      testReleaseId,
      DEFAULT_LIMIT,
      DEFAULT_OFFSET
    );

    expect(afterUnsetResult).not.toBeNull();
    assert(afterUnsetResult != null);

    // note this change due to all the leaves now being unset
    expect(findCase(afterUnsetResult.data, "SIMPSONS")?.nodeStatus).toBe(
      "unselected"
    );
    expect(findSpecimen(afterUnsetResult.data, BART_SPECIMEN)?.nodeStatus).toBe(
      "unselected"
    );
    expect(
      findSpecimen(afterUnsetResult.data, HOMER_SPECIMEN)?.nodeStatus
    ).toBe("unselected");
    expect(
      findSpecimen(afterUnsetResult.data, MARGE_SPECIMEN)?.nodeStatus
    ).toBe("unselected");
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
  let page = 0;

  do {
    page += 1;

    result = await releasesService.getCases(
      allowedDataOwnerUser,
      testReleaseId,
      limit,
      (page - 1) * limit
    );

    expect(result).not.toBeNull();
    assert(result != null);

    for (const c of result.data) {
      allCasesFound.push(c.id);
    }
  } while (result && page <= result.last);

  // 10 cases from 10g and 4 cases from 10f
  expect(allCasesFound.length).toBe(14);
});

it("test identifier searching with case level match", async () => {
  const result = await releasesService.getCases(
    allowedDataOwnerUser,
    testReleaseId,
    DEFAULT_LIMIT,
    DEFAULT_OFFSET,
    "ASHKENAZIM"
  );

  expect(result).not.toBeNull();
  assert(result != null);

  expect(result.data.length).toBe(1);

  // note the preferred identifier scheme is not necessarily the same as was hit in the search
  expect(result.data[0].externalId).toBe("SIMPSONS");
});

it("test identifier searching with patient level match", async () => {
  const result = await releasesService.getCases(
    allowedDataOwnerUser,
    testReleaseId,
    DEFAULT_LIMIT,
    DEFAULT_OFFSET,
    "HOMER"
  );

  expect(result).not.toBeNull();
  assert(result != null);

  expect(result.data.length).toBe(1);
  expect(result.data[0].externalId).toBe("SIMPSONS");
});

it("test identifier searching with specimen level match", async () => {
  const result = await releasesService.getCases(
    allowedDataOwnerUser,
    testReleaseId,
    DEFAULT_LIMIT,
    DEFAULT_OFFSET,
    BART_SPECIMEN
  );

  expect(result).not.toBeNull();
  assert(result != null);

  expect(result.data.length).toBe(1);
  expect(result.data[0].externalId).toBe("SIMPSONS");
});

it("test identifier searching with specimen level partial match (not supported)", async () => {
  const result = await releasesService.getCases(
    allowedDataOwnerUser,
    testReleaseId,
    DEFAULT_LIMIT,
    DEFAULT_OFFSET,
    // only part of a specimen id
    BART_SPECIMEN.substring(0, 3)
  );

  expect(result).not.toBeNull();
  assert(result != null);

  // we DO NOT currently want to support partial matching so this should return nothing
  expect(result.data.length).toBe(0);
});
