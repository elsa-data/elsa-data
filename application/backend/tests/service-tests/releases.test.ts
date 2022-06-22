import { Client, createClient } from "edgedb";
import { blankTestData } from "../../src/test-data/blank-test-data";
import { insert10G, TENG_URI } from "../../src/test-data/insert-test-data-10g";
import e, { release } from "../../dbschema/edgeql-js";
import { releasesService } from "../../src/business/services/releases";
import { AuthenticatedUser } from "../../src/business/authenticated-user";
import { makeSystemlessIdentifier } from "../../src/test-data/insert-test-data-helpers";
import { insert10F } from "../../src/test-data/insert-test-data-10f";
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

let edgeDbClient: Client;
let testReleaseId: string;

let allowedDataOwnerUser: AuthenticatedUser;
let allowedPiUser: AuthenticatedUser;
let notAllowedUser: AuthenticatedUser;

beforeAll(async () => {
  edgeDbClient = createClient({});
});

afterAll(() => {});

beforeEach(async () => {
  await blankTestData();
  await insert10G();
  await insert10F();

  const tenfUri = "urn:fdc:umccr.org:2022:dataset/10f";

  const testReleaseInsert = await e
    .insert(e.release.Release, {
      created: e.datetime(new Date()),
      applicationDacIdentifier: "XYZ",
      applicationDacTitle: "A Study in Many Parts",
      applicationDacDetails:
        "So this is all that we have brought over not coded",
      applicationCoded: e.json({
        version: 1,
        countriesInvolved: [
          {
            system: "urn:iso:std:iso:3166",
            code: "AU",
          },
        ],
        researchType: {
          code: "HMB",
        },
        institutesInvolved: [],
      }),
      // data for this release comes from 10g and 10f datasets
      datasetUris: e.array([TENG_URI, tenfUri]),
      // we set up the test data so that in no circumstances should SINGLETONMARIA->MARIA->HG00174 specimens ever
      // be allowed to be selected
      manualExclusions: e.select(e.dataset.DatasetCase, (dss) => ({
        filter: e.op(
          e.set(makeSystemlessIdentifier("SINGLETONMARIA")),
          "in",
          e.array_unpack(dss.externalIdentifiers)
        ),
        "@who": e.str("PA"),
        "@recorded": e.str("June"),
        "@reason": e.str("Because"),
      })),
      // we pre-select a bunch of specimens across 10g and 10f
      selectedSpecimens: e.select(e.dataset.DatasetSpecimen, (dss) => ({
        filter: e.op(
          e.set(
            makeSystemlessIdentifier("HG00096"),
            makeSystemlessIdentifier("HG00171"),
            makeSystemlessIdentifier("HG00173"),
            makeSystemlessIdentifier("HG03433"),
            makeSystemlessIdentifier("HG1"),
            makeSystemlessIdentifier("HG2"),
            makeSystemlessIdentifier("HG6")
          ),
          "in",
          e.array_unpack(dss.externalIdentifiers)
        ),
      })),
    })
    .run(edgeDbClient);

  testReleaseId = testReleaseInsert.id;

  // data owner has read/write access and complete visibility of everything
  {
    const allowedDataOwnerSubject = "https://i-am-admin.org";

    const allowedDataOwnerUserInsert = await e
      .insert(e.permission.User, {
        subjectId: allowedDataOwnerSubject,
        displayName: "Test User Who Is Allowed Data Owner Access",
        releaseParticipant: e.select(e.release.Release, (r) => ({
          filter: e.op(e.uuid(testReleaseId), "=", r.id),
          "@role": e.str("DataOwner"),
        })),
      })
      .run(edgeDbClient);

    allowedDataOwnerUser = new AuthenticatedUser({
      id: allowedDataOwnerUserInsert.id,
      subjectId: allowedDataOwnerSubject,
    });
  }

  // PI user has limits to read/write and only visibility of released data items
  {
    const allowedPiSubject = "http://subject1.com";

    const allowedPiUserInsert = await e
      .insert(e.permission.User, {
        subjectId: allowedPiSubject,
        displayName: "Test User Who Is Allowed PI Access",
        releaseParticipant: e.select(e.release.Release, (r) => ({
          filter: e.op(e.uuid(testReleaseId), "=", r.id),
          "@role": e.str("PI"),
        })),
      })
      .run(edgeDbClient);

    allowedPiUser = new AuthenticatedUser({
      id: allowedPiUserInsert.id,
      subjectId: allowedPiSubject,
    });
  }

  // not allowed user is valid but shouldn't have ANY access to the release
  {
    const notAllowedSubject = "http://subject3.com";

    const notAllowedUserInsert = await e
      .insert(e.permission.User, {
        subjectId: notAllowedSubject,
        displayName: "Test User Who Isn't Allowed Any Access",
      })
      .run(edgeDbClient);

    notAllowedUser = new AuthenticatedUser({
      id: notAllowedUserInsert.id,
      subjectId: notAllowedSubject,
    });
  }
});

/**
 *
 */
it("allowed users can get release data", async () => {
  const result = await releasesService.get(allowedPiUser, testReleaseId);
});

/**
 *
 */
it("not allowed users cannot get release data", async () => {
  await expect(async () => {
    const result = await releasesService.get(notAllowedUser, testReleaseId);
  }).rejects.toThrow(Error);
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

  expect(findSpecimen(pagedResult.data, "HG1")?.nodeStatus).toBe("selected");
  expect(findSpecimen(pagedResult.data, "HG2")?.nodeStatus).toBe("selected");
  expect(findSpecimen(pagedResult.data, "HG3")?.nodeStatus).toBe("unselected");
  expect(findSpecimen(pagedResult.data, "HG4")?.nodeStatus).toBe("unselected");

  // not expecting to find DUCKS at all as the case is not visible to non data owners because nothing selected
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

it("aa", async () => {
  const l = new LinkHeader();

  l.set({ rel: "next", uri: "http://example.com/next" });

  console.log(l.toString());
});

it("bb", async () => {
  await releasesAwsService.getPresigned(allowedPiUser, testReleaseId);
});
