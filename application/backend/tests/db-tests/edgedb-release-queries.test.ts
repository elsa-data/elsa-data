import { Client, createClient } from "edgedb";
import e from "../../dbschema/edgeql-js";
import { blankTestData } from "../../src/test-data/blank-test-data";
import { insertRelease2 } from "../../src/test-data/insert-test-data-release2";
import { insertRelease4 } from "../../src/test-data/insert-test-data-release4";
import { insertRelease3 } from "../../src/test-data/insert-test-data-release3";
import { allReleasesSummaryByUserQuery } from "../../src/business/db/release-queries";
import { UsersService } from "../../src/business/services/users-service";

describe("edgedb release queries tests", () => {
  let edgeDbClient: Client;
  let release1: { id: string };
  let release2: { id: string };
  let release3: { id: string };
  let release4: { id: string };

  beforeAll(async () => {
    edgeDbClient = createClient({});
  });

  afterAll(() => {});

  beforeEach(async () => {
    await blankTestData();
    // release1 = await insertRelease1(); release 1 has a dependence on Settings (which we should fix) - so not
    // suitable at the raw db level
    release2 = await insertRelease2();
    release3 = await insertRelease3();
    release4 = await insertRelease4();
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

    await UsersService.addUserToReleaseWithRole(
      edgeDbClient,
      release2.id,
      testUserInsert.id,
      "PI",
      "id1",
      "name1"
    );

    await UsersService.addUserToReleaseWithRole(
      edgeDbClient,
      release3.id,
      testUserInsert.id,
      "DataOwner",
      "id2",
      "name2"
    );

    // and we don't add them into release 4 at all

    const result = await allReleasesSummaryByUserQuery.run(edgeDbClient, {
      userDbId: testUserInsert.id,
      limit: 100,
      offset: 0,
    });

    expect(result).not.toBeNull();
    expect(result).toHaveProperty("releaseParticipant");
    expect(result!.releaseParticipant.length).toBe(2);

    {
      const a = result!.releaseParticipant[0];

      expect(a.releaseIdentifier).toBe("P4RF4AC5BR");
      expect(a.applicationDacTitle).toBe("An Invisible Study");
      expect(a["@role"]).toBe("DataOwner");
    }

    {
      const b = result!.releaseParticipant[1];

      expect(b.releaseIdentifier).toBe("RH5WOR7QXB");
      expect(b.applicationDacTitle).toBe("A Better Study of Limited Test Data");
      expect(b["@role"]).toBe("PI");
    }
  });

  it("get all on releases returns nothing if noone involved", async () => {
    const testUserInsert = await createTestUser();

    const result = await allReleasesSummaryByUserQuery.run(edgeDbClient, {
      userDbId: testUserInsert.id,
      limit: 100,
      offset: 0,
    });

    expect(result).not.toBeNull();
    expect(result).toHaveProperty("releaseParticipant");
    expect(result!.releaseParticipant.length).toBe(0);
  });

  it("get all on releases does basic paging", async () => {
    const testUserInsert = await createTestUser();

    await UsersService.addUserToReleaseWithRole(
      edgeDbClient,
      release2.id,
      testUserInsert.id,
      "PI",
      "id1",
      "name1"
    );

    await UsersService.addUserToReleaseWithRole(
      edgeDbClient,
      release3.id,
      testUserInsert.id,
      "DataOwner",
      "id2",
      "name2"
    );

    await UsersService.addUserToReleaseWithRole(
      edgeDbClient,
      release4.id,
      testUserInsert.id,
      "Member",
      "id3",
      "name3"
    );

    {
      const result1 = await allReleasesSummaryByUserQuery.run(edgeDbClient, {
        userDbId: testUserInsert.id,
        limit: 1,
        offset: 1,
      });

      expect(result1).not.toBeNull();
      expect(result1).toHaveProperty("releaseParticipant");
      expect(result1!.releaseParticipant.length).toBe(1);
      expect(result1!.releaseParticipant[0].releaseIdentifier).toBe(
        "RH5WOR7QXB"
      );
    }

    {
      const result2 = await allReleasesSummaryByUserQuery.run(edgeDbClient, {
        userDbId: testUserInsert.id,
        limit: 1,
        offset: 2,
      });

      expect(result2).not.toBeNull();
      expect(result2).toHaveProperty("releaseParticipant");
      expect(result2!.releaseParticipant.length).toBe(1);
      expect(result2!.releaseParticipant[0].releaseIdentifier).toBe(
        "S9DT3Z9NMA"
      );
    }
  });
});
