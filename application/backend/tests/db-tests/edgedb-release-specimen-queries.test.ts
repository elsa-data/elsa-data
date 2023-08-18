import { Client, createClient } from "edgedb";
import { blankTestData } from "../../src/test-data/util/blank-test-data";
import { releaseGetSpecimensByDbIdsAndExternalIdentifiers } from "../../dbschema/queries";
import { registerTypes } from "../test-dependency-injection.common";
import { TENF_URI } from "../../src/test-data/dataset/insert-test-data-10f-helpers";
import { insertUser2 } from "../../src/test-data/user/insert-user2";
import { insert10F } from "../../src/test-data/dataset/insert-test-data-10f";
import {
  CHARLES_CASE_SYSTEMLESS,
  CHARLES_PATIENT_SYSTEMLESS,
  CHARLES_SPECIMEN_SYSTEMLESS,
  insert10G,
} from "../../src/test-data/dataset/insert-test-data-10g";
import {
  insertRelease1,
  RELEASE_KEY_1,
} from "../../src/test-data/release/insert-test-data-release1";
import {
  findDatabaseCaseIds,
  findDatabasePatientIds,
  findDatabaseSpecimenIds,
} from "../service-tests/utils";
import {
  BART_PATIENT_1KGP,
  BART_PATIENT_SYSTEMLESS,
  BART_SPECIMEN,
  HOMER_SPECIMEN,
  MARGE_SPECIMEN,
  SIMPSONS_CASE,
} from "../../src/test-data/dataset/insert-test-data-10f-simpsons";
import { ELROY_SPECIMEN } from "../../src/test-data/dataset/insert-test-data-10f-jetsons";

const testContainer = registerTypes();

describe("edgedb release specimen query tests", () => {
  let edgeDbClient: Client;

  let simpsonsCaseDbId: string;
  let bartPatientDbId: string;
  let bartSpecimenDbId: string;
  let homerSpecimenDbId: string;
  let margeSpecimenDbId: string;
  let elroySpecimenDbId: string;
  let charlesCaseDbId: string;
  let charlesPatientDbId: string;
  let charlesSpecimenDbId: string;

  //
  // NOTE: the initialisation for this test is only executed *once* before all tests
  //       that is because all the tests are readonly pure database queries
  //       by extracting out the initialisation we are better placed to examine the relative query performance
  //       DO NOT ADD IN TESTS THAT MUTATE STATE OR ELSE THE TESTS WILL END UP INCONSISTENT
  //

  beforeAll(async () => {
    edgeDbClient = createClient({});

    await blankTestData();
    await insert10F(testContainer);
    await insert10G(testContainer);

    const releaseProps = {
      releaseAdministrator: [await insertUser2(testContainer)],
      releaseMember: [],
      releaseManager: [],
      // whilst we have loaded the 10G dataset into the db - we don't include it in
      // this release so we can establish test cases showing cross-linking
      datasetUris: [TENF_URI],
    };

    await insertRelease1(testContainer, releaseProps);

    // find the canonical "correct" db ids for all sorts of things
    simpsonsCaseDbId = (
      await findDatabaseCaseIds(edgeDbClient, [SIMPSONS_CASE])
    )[0];
    bartPatientDbId = (
      await findDatabasePatientIds(edgeDbClient, [BART_PATIENT_SYSTEMLESS])
    )[0];
    bartSpecimenDbId = (
      await findDatabaseSpecimenIds(edgeDbClient, [BART_SPECIMEN])
    )[0];
    homerSpecimenDbId = (
      await findDatabaseSpecimenIds(edgeDbClient, [HOMER_SPECIMEN])
    )[0];
    margeSpecimenDbId = (
      await findDatabaseSpecimenIds(edgeDbClient, [MARGE_SPECIMEN])
    )[0];
    elroySpecimenDbId = (
      await findDatabaseSpecimenIds(edgeDbClient, [ELROY_SPECIMEN])
    )[0];
    charlesCaseDbId = (
      await findDatabaseCaseIds(edgeDbClient, [CHARLES_CASE_SYSTEMLESS])
    )[0];
    charlesPatientDbId = (
      await findDatabasePatientIds(edgeDbClient, [CHARLES_PATIENT_SYSTEMLESS])
    )[0];
    charlesSpecimenDbId = (
      await findDatabaseSpecimenIds(edgeDbClient, [CHARLES_SPECIMEN_SYSTEMLESS])
    )[0];
  });

  afterAll(() => {});

  beforeEach(async () => {});

  it("test basic selection by single specimen db id", async () => {
    const specimensResult =
      await releaseGetSpecimensByDbIdsAndExternalIdentifiers(edgeDbClient, {
        releaseKey: RELEASE_KEY_1,
        dbIds: [bartSpecimenDbId],
        externalIdentifierValues: [],
      });

    expect(specimensResult.specimens).toHaveLength(1);
    expect(
      specimensResult.specimens.map((a) => a.id).includes(bartSpecimenDbId)
    ).toBeTruthy();
  });

  it("test basic selection by single patient db id", async () => {
    const specimensResult =
      await releaseGetSpecimensByDbIdsAndExternalIdentifiers(edgeDbClient, {
        releaseKey: RELEASE_KEY_1,
        dbIds: [bartPatientDbId],
        externalIdentifierValues: [],
      });

    expect(specimensResult.specimens).toHaveLength(1);
    expect(
      specimensResult.specimens.map((a) => a.id).includes(bartSpecimenDbId)
    ).toBeTruthy();
  });

  it("test basic selection by single case db id", async () => {
    const specimensResult =
      await releaseGetSpecimensByDbIdsAndExternalIdentifiers(edgeDbClient, {
        releaseKey: RELEASE_KEY_1,
        dbIds: [simpsonsCaseDbId],
        externalIdentifierValues: [],
      });

    expect(specimensResult.specimens).toHaveLength(3);
    expect(specimensResult.invalidDbIds).toHaveLength(0);
    expect(specimensResult.crossLinkedSpecimenCount).toBe(0);
    expect(specimensResult.crossLinkedPatientCount).toBe(0);
    expect(specimensResult.crossLinkedCaseCount).toBe(0);
    expect(
      specimensResult.specimens.map((a) => a.id).includes(bartSpecimenDbId)
    ).toBeTruthy();
    expect(
      specimensResult.specimens.map((a) => a.id).includes(homerSpecimenDbId)
    ).toBeTruthy();
    expect(
      specimensResult.specimens.map((a) => a.id).includes(margeSpecimenDbId)
    ).toBeTruthy();
  });

  it("test basic selection by single specimen external identifier", async () => {
    const specimensResult =
      await releaseGetSpecimensByDbIdsAndExternalIdentifiers(edgeDbClient, {
        releaseKey: RELEASE_KEY_1,
        dbIds: [],
        externalIdentifierValues: [BART_SPECIMEN],
      });

    expect(specimensResult.specimens).toHaveLength(1);
    expect(specimensResult.invalidDbIds).toHaveLength(0);
    expect(specimensResult.crossLinkedSpecimenCount).toBe(0);
    expect(specimensResult.crossLinkedPatientCount).toBe(0);
    expect(specimensResult.crossLinkedCaseCount).toBe(0);
    expect(
      specimensResult.specimens.map((a) => a.id).includes(bartSpecimenDbId)
    ).toBeTruthy();
  });

  it("test basic selection by single patient external identifier", async () => {
    const specimensResult =
      await releaseGetSpecimensByDbIdsAndExternalIdentifiers(edgeDbClient, {
        releaseKey: RELEASE_KEY_1,
        dbIds: [],
        externalIdentifierValues: [BART_PATIENT_1KGP],
      });

    expect(specimensResult.specimens).toHaveLength(1);
    expect(specimensResult.invalidDbIds).toHaveLength(0);
    expect(specimensResult.crossLinkedSpecimenCount).toBe(0);
    expect(specimensResult.crossLinkedPatientCount).toBe(0);
    expect(specimensResult.crossLinkedCaseCount).toBe(0);
    expect(
      specimensResult.specimens.map((a) => a.id).includes(bartSpecimenDbId)
    ).toBeTruthy();
  });

  it("test basic selection by single case external identifier", async () => {
    const specimensResult =
      await releaseGetSpecimensByDbIdsAndExternalIdentifiers(edgeDbClient, {
        releaseKey: RELEASE_KEY_1,
        dbIds: [],
        externalIdentifierValues: [SIMPSONS_CASE],
      });

    expect(specimensResult.specimens).toHaveLength(3);
    expect(specimensResult.invalidDbIds).toHaveLength(0);
    expect(specimensResult.crossLinkedSpecimenCount).toBe(0);
    expect(specimensResult.crossLinkedPatientCount).toBe(0);
    expect(specimensResult.crossLinkedCaseCount).toBe(0);
    expect(
      specimensResult.specimens.map((a) => a.id).includes(bartSpecimenDbId)
    ).toBeTruthy();
    expect(
      specimensResult.specimens.map((a) => a.id).includes(homerSpecimenDbId)
    ).toBeTruthy();
    expect(
      specimensResult.specimens.map((a) => a.id).includes(margeSpecimenDbId)
    ).toBeTruthy();
  });

  it("test case sensitivity of external identifier", async () => {
    const specimensResult =
      await releaseGetSpecimensByDbIdsAndExternalIdentifiers(edgeDbClient, {
        releaseKey: RELEASE_KEY_1,
        dbIds: [],
        // lowercase the id
        externalIdentifierValues: [SIMPSONS_CASE.toLowerCase()],
      });

    // our expectation is that for this query case must match
    expect(specimensResult.specimens).toHaveLength(0);
    expect(specimensResult.invalidDbIds).toHaveLength(0);
    expect(specimensResult.crossLinkedSpecimenCount).toBe(0);
    expect(specimensResult.crossLinkedPatientCount).toBe(0);
    expect(specimensResult.crossLinkedCaseCount).toBe(0);
  });

  it("test case cross-link selection with single case db id", async () => {
    const specimensResult =
      await releaseGetSpecimensByDbIdsAndExternalIdentifiers(edgeDbClient, {
        releaseKey: RELEASE_KEY_1,
        dbIds: [charlesCaseDbId],
        externalIdentifierValues: [],
      });

    expect(specimensResult.specimens).toHaveLength(0);
    expect(specimensResult.invalidDbIds).toHaveLength(0);
    expect(specimensResult.crossLinkedSpecimenCount).toBe(0);
    expect(specimensResult.crossLinkedPatientCount).toBe(0);
    expect(specimensResult.crossLinkedCaseCount).toBe(1);
  });

  it("test case cross-link selection with single patient db id", async () => {
    const specimensResult =
      await releaseGetSpecimensByDbIdsAndExternalIdentifiers(edgeDbClient, {
        releaseKey: RELEASE_KEY_1,
        dbIds: [charlesPatientDbId],
        externalIdentifierValues: [],
      });

    expect(specimensResult.specimens).toHaveLength(0);
    expect(specimensResult.invalidDbIds).toHaveLength(0);
    expect(specimensResult.crossLinkedSpecimenCount).toBe(0);
    expect(specimensResult.crossLinkedPatientCount).toBe(1);
    expect(specimensResult.crossLinkedCaseCount).toBe(0);
  });

  it("test case cross-link selection with single specimen db id", async () => {
    const specimensResult =
      await releaseGetSpecimensByDbIdsAndExternalIdentifiers(edgeDbClient, {
        releaseKey: RELEASE_KEY_1,
        dbIds: [charlesSpecimenDbId],
        externalIdentifierValues: [],
      });

    expect(specimensResult.specimens).toHaveLength(0);
    expect(specimensResult.invalidDbIds).toHaveLength(0);
    expect(specimensResult.crossLinkedSpecimenCount).toBe(1);
    expect(specimensResult.crossLinkedPatientCount).toBe(0);
    expect(specimensResult.crossLinkedCaseCount).toBe(0);
  });

  it("test use of an invalid db id", async () => {
    const specimensResult =
      await releaseGetSpecimensByDbIdsAndExternalIdentifiers(edgeDbClient, {
        releaseKey: RELEASE_KEY_1,
        dbIds: ["4da8d9d1-ca33-48f4-a1fd-986d5fe1d13c"],
        externalIdentifierValues: [],
      });

    expect(specimensResult.specimens).toHaveLength(0);
    expect(specimensResult.invalidDbIds).toHaveLength(1);
    expect(specimensResult.crossLinkedSpecimenCount).toBe(0);
    expect(specimensResult.crossLinkedPatientCount).toBe(0);
    expect(specimensResult.crossLinkedCaseCount).toBe(0);
  });

  it("test full query with combination of all id types", async () => {
    const specimensResult =
      await releaseGetSpecimensByDbIdsAndExternalIdentifiers(edgeDbClient, {
        releaseKey: RELEASE_KEY_1,
        dbIds: [
          simpsonsCaseDbId,
          charlesSpecimenDbId,
          charlesCaseDbId,
          charlesPatientDbId,
          "4da8d9d1-ca33-48f4-a1fd-986d5fe1d13c",
        ],
        externalIdentifierValues: ["ELROY", "donald"],
      });

    // all the simpsons + elroy
    expect(specimensResult.specimens).toHaveLength(4);
    expect(specimensResult.invalidDbIds).toHaveLength(1);
    expect(specimensResult.crossLinkedSpecimenCount).toBe(1);
    expect(specimensResult.crossLinkedPatientCount).toBe(1);
    expect(specimensResult.crossLinkedCaseCount).toBe(1);

    expect(
      specimensResult.specimens.map((a) => a.id).includes(elroySpecimenDbId)
    ).toBeTruthy();
  });
});
