import { Client, createClient } from "edgedb";
import { blankTestData } from "../../src/test-data/util/blank-test-data";

describe("edgedb tests", () => {
  let edgeDbClient: Client;

  beforeAll(async () => {
    edgeDbClient = createClient({});
  });

  afterAll(() => {});

  beforeEach(async () => {
    await blankTestData();
  });

  it("can connect using the client for a basic select", async () => {
    const result = await edgeDbClient.querySingle(`select 2 + 2;`);

    expect(result).toBe(4);
  });
});
