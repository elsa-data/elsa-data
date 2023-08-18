import { Client, createClient } from "edgedb";
import { blankTestData } from "../../src/test-data/util/blank-test-data";
import { releaseGetSpecimensByDbIdsAndExternalIdentifiers } from "../../dbschema/queries";
import { registerTypes } from "../test-dependency-injection.common";
import { TENF_URI } from "../../src/test-data/dataset/insert-test-data-10f-helpers";
import { ReleaseActivationService } from "../../src/business/services/releases/release-activation-service";
import { AuthenticatedUser } from "../../src/business/authenticated-user";
import { UserObject } from "../../src/test-data/user/helpers";
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
  BART_PATIENT_SYSTEMLESS,
  BART_SPECIMEN,
  HOMER_SPECIMEN,
  MARGE_SPECIMEN,
  SIMPSONS_CASE,
} from "../../src/test-data/dataset/insert-test-data-10f-simpsons";

const testContainer = registerTypes();

describe("edgedb release search (get specimens by identifiers) query tests", () => {
  let edgeDbClient: Client;
  let adminUserObj: UserObject;
  let adminAuthUser: AuthenticatedUser;

  let simpsonsCaseDbId: string;
  let bartPatientDbId: string;
  let bartSpecimenDbId: string;
  let homerSpecimenDbId: string;
  let margeSpecimenDbId: string;
  let charlesCaseDbId: string;
  let charlesPatientDbId: string;
  let charlesSpecimenDbId: string;

  beforeAll(async () => {
    edgeDbClient = createClient({});
  });

  afterAll(() => {});

  beforeEach(async () => {
    await blankTestData();
    await insert10F(testContainer);
    await insert10G(testContainer);
    adminUserObj = await insertUser2(testContainer);
    adminAuthUser = new AuthenticatedUser({
      id: adminUserObj.dbId!,
      subjectId: adminUserObj.subjectId,
      displayName: adminUserObj.name,
      email: adminUserObj.email,
    });

    const releaseProps = {
      releaseAdministrator: [adminUserObj],
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
});
