import { AuthenticatedUser } from "../../src/business/authenticated-user";
import assert from "assert";
import {
  allSpecimens,
  findCase,
  findDatabaseSpecimenIds,
  findPatientExpected,
  findSpecimen,
} from "./utils";
import { ReleaseSpecimenType } from "@umccr/elsa-types";
import { beforeEachCommon } from "./releases.common";
import { registerTypes } from "../test-dependency-injection.common";
import { Client } from "edgedb";
import {
  BART_SPECIMEN,
  HOMER_SPECIMEN,
  MARGE_SPECIMEN,
  SIMPSONS_CASE,
} from "../../src/test-data/dataset/insert-test-data-10f-simpsons";
import {
  ELROY_SPECIMEN,
  GEORGE_SPECIMEN,
  JETSONS_CASE,
  JUDY_SPECIMEN,
} from "../../src/test-data/dataset/insert-test-data-10f-jetsons";
import { ReleaseSelectionService } from "../../src/business/services/releases/release-selection-service";
import { ReleaseSelectionDatasetMismatchError } from "../../src/business/exceptions/release-selection";
import { TN_1_SPECIMEN_TUMOUR } from "../../src/test-data/dataset/insert-test-data-10c";

let edgeDbClient: Client;
let releaseSelectionService: ReleaseSelectionService;
let testReleaseKey: string;

let superAdminUser: AuthenticatedUser;
let allowedManagerUser: AuthenticatedUser;
let notAllowedUser: AuthenticatedUser;

const DEFAULT_LIMIT = 10000;
const DEFAULT_OFFSET = 0;

const testContainer = registerTypes();

beforeAll(async () => {
  edgeDbClient = testContainer.resolve("Database");
  releaseSelectionService = testContainer.resolve(ReleaseSelectionService);
});

beforeEach(async () => {
  ({ testReleaseKey, superAdminUser, allowedManagerUser, notAllowedUser } =
    await beforeEachCommon(testContainer));
});

/**
 *
 */
it("get all case level information from a release as a administrator", async () => {
  const pagedResult = await releaseSelectionService.getCases(
    superAdminUser,
    testReleaseKey,
    DEFAULT_LIMIT,
    DEFAULT_OFFSET
  );

  expect(pagedResult).not.toBeNull();
  assert(pagedResult != null);
  assert(pagedResult.data != null);

  // as the administrator we will see everything
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
it("get limited case level information from a release as a Manager", async () => {
  const pagedResult = await releaseSelectionService.getCases(
    allowedManagerUser,
    testReleaseKey,
    DEFAULT_LIMIT,
    DEFAULT_OFFSET
  );

  expect(pagedResult).not.toBeNull();
  assert(pagedResult != null);
  assert(pagedResult.data != null);

  // as a Manager we will only see cases that have _something_ selected in them
  expect(pagedResult.data.length).toBe(6);

  // because the Manager has no concept of 'unselected' item - every node present is selected
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
  const pagedResult = await releaseSelectionService.getCases(
    superAdminUser,
    testReleaseKey,
    DEFAULT_LIMIT,
    DEFAULT_OFFSET
  );

  expect(pagedResult).not.toBeNull();
  assert(pagedResult != null);
  assert(pagedResult.data != null);

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
    const initialResult = await releaseSelectionService.getCases(
      superAdminUser,
      testReleaseKey,
      DEFAULT_LIMIT,
      DEFAULT_OFFSET
    );

    assert(initialResult != null);
    assert(initialResult.data != null);

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

  await releaseSelectionService.setSelected(
    superAdminUser,
    testReleaseKey,
    await findDatabaseSpecimenIds(edgeDbClient, [
      "HG00097",
      ELROY_SPECIMEN,
      GEORGE_SPECIMEN,
    ])
  );

  {
    const afterSetResult = await releaseSelectionService.getCases(
      superAdminUser,
      testReleaseKey,
      DEFAULT_LIMIT,
      DEFAULT_OFFSET
    );

    expect(afterSetResult).not.toBeNull();
    assert(afterSetResult != null);
    assert(afterSetResult.data != null);

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

  await releaseSelectionService.setUnselected(
    superAdminUser,
    testReleaseKey,
    await findDatabaseSpecimenIds(edgeDbClient, [BART_SPECIMEN, HOMER_SPECIMEN])
  );

  {
    const afterUnsetResult = await releaseSelectionService.getCases(
      superAdminUser,
      testReleaseKey,
      DEFAULT_LIMIT,
      DEFAULT_OFFSET
    );

    expect(afterUnsetResult).not.toBeNull();
    assert(afterUnsetResult != null);
    assert(afterUnsetResult.data != null);

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

it("(un-)selects all when setSelectedStatus is passed an empty list", async () => {
  const allSpecimens_ = async (): Promise<ReleaseSpecimenType[]> => {
    const result = await releaseSelectionService.getCases(
      superAdminUser,
      testReleaseKey,
      DEFAULT_LIMIT,
      DEFAULT_OFFSET
    );

    assert(result != null);
    assert(result.data != null);

    const specimens = allSpecimens(result.data);

    assert(specimens.length > 0);

    return specimens;
  };

  await releaseSelectionService.setSelected(superAdminUser, testReleaseKey, []);
  expect(
    (await allSpecimens_()).every((s) => s.nodeStatus === "selected")
  ).toBe(true);

  await releaseSelectionService.setUnselected(
    superAdminUser,
    testReleaseKey,
    []
  );
  expect(
    (await allSpecimens_()).every((s) => s.nodeStatus === "unselected")
  ).toBe(true);
});

it("pass in specimen ids that are not valid", async () => {
  await expect(async () => {
    await releaseSelectionService.setSelected(
      superAdminUser,
      testReleaseKey,
      // whilst this looks vaguely like an edgedb id it will never match
      ["aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"]
    );
  }).rejects.toThrow(ReleaseSelectionDatasetMismatchError);

  // a slightly more difficult one where we pass in a valid specimen id - but the
  // specimen id belongs to a dataset not in our release
  await expect(async () => {
    await releaseSelectionService.setSelected(
      superAdminUser,
      testReleaseKey,
      await findDatabaseSpecimenIds(edgeDbClient, [TN_1_SPECIMEN_TUMOUR])
    );
  }).rejects.toThrow(ReleaseSelectionDatasetMismatchError);
});

/*it("test paging", async () => {
  const allCasesFound: string[] = [];

  const limit = 3;

  let result: PagedResult<ReleaseCaseType> | null = null;
  let page = 0;

  do {
    page += 1;

    result = await releaseSelectionService.getCases(
      superAdminUser,
      testReleaseKey,
      limit,
      (page - 1) * limit
    );

    expect(result).not.toBeNull();
    assert(result != null);
    assert(result.data != null);

    for (const c of result.data) {
      allCasesFound.push(c.id);
    }
  } while (result && page <= result.last);

  // 10 cases from 10g and 4 cases from 10f
  expect(allCasesFound.length).toBe(14);
}); */

it("test identifier searching with case level match", async () => {
  const result = await releaseSelectionService.getCases(
    superAdminUser,
    testReleaseKey,
    DEFAULT_LIMIT,
    DEFAULT_OFFSET,
    "ASHKENAZIM"
  );

  expect(result).not.toBeNull();
  assert(result != null);
  assert(result.data != null);

  expect(result.data.length).toBe(1);

  // note the preferred identifier scheme is not necessarily the same as was hit in the search
  expect(result.data[0].externalId).toBe("SIMPSONS");
});

it("test identifier searching with patient level match", async () => {
  const result = await releaseSelectionService.getCases(
    superAdminUser,
    testReleaseKey,
    DEFAULT_LIMIT,
    DEFAULT_OFFSET,
    "HOMER"
  );

  expect(result).not.toBeNull();
  assert(result != null);
  assert(result.data != null);

  expect(result.data.length).toBe(1);
  expect(result.data[0].externalId).toBe("SIMPSONS");
});

it("test identifier searching with specimen level match", async () => {
  const result = await releaseSelectionService.getCases(
    superAdminUser,
    testReleaseKey,
    DEFAULT_LIMIT,
    DEFAULT_OFFSET,
    BART_SPECIMEN
  );

  expect(result).not.toBeNull();
  assert(result != null);
  assert(result.data != null);

  expect(result.data.length).toBe(1);
  expect(result.data[0].externalId).toBe("SIMPSONS");
});

it("test identifier searching with specimen level partial match (not supported)", async () => {
  const result = await releaseSelectionService.getCases(
    superAdminUser,
    testReleaseKey,
    DEFAULT_LIMIT,
    DEFAULT_OFFSET,
    // only part of a specimen id
    BART_SPECIMEN.substring(0, 3)
  );

  expect(result).not.toBeNull();
  assert(result != null);
  assert(result.data != null);

  // we DO NOT currently want to support partial matching so this should return nothing
  expect(result.data.length).toBe(0);
});
