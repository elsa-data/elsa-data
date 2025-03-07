import { Client, createClient } from "gel";
import { blankTestData } from "../../src/test-data/util/blank-test-data";

describe("gel plumbing tests", () => {
  let gelClient: Client;

  beforeAll(async () => {
    gelClient = createClient({});
  });

  afterAll(() => {});

  beforeEach(async () => {
    await blankTestData();
  });

  it("can connect using the client for a basic select", async () => {
    const result = await gelClient.querySingle(`select 2 + 2;`);

    expect(result).toBe(4);
  });
});
