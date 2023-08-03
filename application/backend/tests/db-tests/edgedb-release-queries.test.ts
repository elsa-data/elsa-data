import { Client, createClient } from "edgedb";
import e from "../../dbschema/edgeql-js";
import { blankTestData } from "../../src/test-data/util/blank-test-data";
import {
  TEST_SUBJECT_3,
  TEST_SUBJECT_3_DISPLAY,
  TEST_SUBJECT_3_EMAIL,
} from "../../src/test-data/user/insert-user3";
import {
  insertRelease2,
  RELEASE2_APPLICATION_DAC_TITLE,
  RELEASE2_RELEASE_IDENTIFIER,
} from "../../src/test-data/release/insert-test-data-release2";
import { insertRelease4 } from "../../src/test-data/release/insert-test-data-release4";
import { insertRelease3 } from "../../src/test-data/release/insert-test-data-release3";
import { UserService } from "../../src/business/services/user-service";
import { releaseGetAllByUser } from "../../dbschema/queries";
import { registerTypes } from "../test-dependency-injection.common";
import { TENF_URI } from "../../src/test-data/dataset/insert-test-data-10f-helpers";
import { AuditEventService } from "../../src/business/services/audit-event-service";

const testContainer = registerTypes();
let auditEventService: AuditEventService;

describe("edgedb release queries tests", () => {
  let edgeDbClient: Client;
  let release1: { id: string };
  let release2: { id: string };
  let release3: { id: string };
  let release4: { id: string };

  let releaseKey2: string;
  let releaseKey3: string;
  let releaseKey4: string;

  beforeAll(async () => {
    edgeDbClient = createClient({});
  });

  afterAll(() => {});

  beforeEach(async () => {
    const releaseProps = {
      releaseAdministrator: [
        {
          subject_id: TEST_SUBJECT_3,
          email: TEST_SUBJECT_3_EMAIL,
          name: TEST_SUBJECT_3_DISPLAY,
        },
      ],
      releaseMember: [],
      releaseManager: [],
      datasetUris: [TENF_URI],
    };

    await blankTestData();
    // release1 = await insertRelease1(); release 1 has a dependence on Settings (which we should fix) - so not
    // suitable at the raw db level
    release2 = await insertRelease2(testContainer, releaseProps);
    release3 = await insertRelease3(testContainer, releaseProps);
    release4 = await insertRelease4(testContainer, releaseProps);

    const getReleaseKey = async (id: string): Promise<string> => {
      const release = await e
        .select(e.release.Release, (_) => ({
          releaseKey: true,
          filter_single: { id },
        }))
        .run(edgeDbClient);

      return release!.releaseKey;
    };

    releaseKey2 = await getReleaseKey(release2.id);
    releaseKey3 = await getReleaseKey(release3.id);
    releaseKey4 = await getReleaseKey(release4.id);

    auditEventService = testContainer.resolve(AuditEventService);
  });

  async function createTestUser() {
    return await e
      .insert(e.permission.User, {
        subjectId: "asubjectid",
        displayName: "A Display Name",
        email: "an@email.com",
      })
      .run(edgeDbClient);
  }

  it("get all on releases returns correct roles and fields", async () => {
    const testUserInsert = await createTestUser();

    await UserService.addUserToReleaseWithRole(
      edgeDbClient,
      releaseKey2,
      testUserInsert.id,
      "Manager",
      "id1",
      "name1",
      auditEventService
    );

    await UserService.addUserToReleaseWithRole(
      edgeDbClient,
      releaseKey3,
      testUserInsert.id,
      "Administrator",
      "id2",
      "name2",
      auditEventService
    );

    // and we don't add them into release 4 at all

    const result = await releaseGetAllByUser(edgeDbClient, {
      userDbId: testUserInsert.id,
      limit: 100,
      offset: 0,
    });

    expect(result).not.toBeNull();
    expect(result!.data.length).toBe(2);

    {
      const a = result!.data[0];

      expect(a.releaseKey).toBe("R003");
      expect(a.applicationDacTitle).toBe("An Invisible Study");
      expect(a.role).toBe("Administrator");
    }

    {
      const b = result!.data[1];

      expect(b.releaseKey).toBe(RELEASE2_RELEASE_IDENTIFIER);
      expect(b.applicationDacTitle).toBe(RELEASE2_APPLICATION_DAC_TITLE);
      expect(b.role).toBe("Manager");
    }
  });

  it("get all on releases returns nothing if noone involved", async () => {
    const testUserInsert = await createTestUser();

    const result = await releaseGetAllByUser(edgeDbClient, {
      userDbId: testUserInsert.id,
      limit: 100,
      offset: 0,
    });

    expect(result).not.toBeNull();
    expect(result!.data.length).toBe(0);
    expect(result!.total).toBe(0);
  });

  it("get all on releases does basic paging", async () => {
    const testUserInsert = await createTestUser();

    await UserService.addUserToReleaseWithRole(
      edgeDbClient,
      releaseKey2,
      testUserInsert.id,
      "Manager",
      "id1",
      "name1",
      auditEventService
    );

    await UserService.addUserToReleaseWithRole(
      edgeDbClient,
      releaseKey3,
      testUserInsert.id,
      "Administrator",
      "id2",
      "name2",
      auditEventService
    );

    await UserService.addUserToReleaseWithRole(
      edgeDbClient,
      releaseKey4,
      testUserInsert.id,
      "Member",
      "id3",
      "name3",
      auditEventService
    );

    {
      const result1 = await releaseGetAllByUser(edgeDbClient, {
        userDbId: testUserInsert.id,
        limit: 1,
        offset: 1,
      });

      expect(result1).not.toBeNull();
      expect(result1!.data.length).toBe(1);
      expect(result1!.data[0].releaseKey).toBe("R003");
      expect(result1!.total).toBe(3);
    }

    {
      const result2 = await releaseGetAllByUser(edgeDbClient, {
        userDbId: testUserInsert.id,
        limit: 1,
        offset: 0,
      });

      expect(result2).not.toBeNull();
      expect(result2!.data.length).toBe(1);
      expect(result2!.data[0].releaseKey).toBe("R004");
      expect(result2!.total).toBe(3);
    }
  });
});
