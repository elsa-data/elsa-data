import { Client, createClient } from "edgedb";
import e from "../../dbschema/edgeql-js";
import { blankTestData } from "../../src/test-data/util/blank-test-data";
import { UserData } from "../../src/business/data/user-data";
import { ElsaSettings } from "../../src/config/elsa-settings";

describe("user load tests", () => {
  let edgeDbClient: Client;
  let userData: UserData;

  beforeAll(async () => {
    edgeDbClient = createClient({});
  });

  afterAll(() => {});

  beforeEach(async () => {
    await blankTestData();
  });

  it("create a lot of users and query", async () => {
    const query = e.params({ items: e.json }, (params) => {
      return e.for(e.json_array_unpack(params.items), (item) => {
        return e.insert(e.permission.User, {
          subjectId: e.cast(e.str, item.subjectId),
          email: e.cast(e.str, item.email),
          displayName: e.cast(e.str, item.displayName),
        });
      });
    });

    const allUserItems = [];

    for (let i = 0; i < 500000; i++) {
      allUserItems.push({
        subjectId: `https://subject-${i}`,
        email: `person${i}@place.com`,
        displayName: `Person ${i}`,
      });
    }

    const result = await query.run(edgeDbClient, {
      items: allUserItems,
    });

    expect(result).toHaveLength(500000);

    userData = new UserData({} as ElsaSettings);

    console.time("Q");

    await userData.getDbUserBySubjectId(edgeDbClient, "https://subject-55");

    console.timeEnd("Q");

    console.time("Q2");

    await userData.getDbUserByEmail(edgeDbClient, "PErson1065@place.com");

    console.timeEnd("Q2");
  });
});
