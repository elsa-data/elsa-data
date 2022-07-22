import { Client, createClient } from "edgedb";
import { blankTestData } from "../../src/test-data/blank-test-data";
import { insert10G } from "../../src/test-data/insert-test-data-10g";
import e from "../../dbschema/edgeql-js";
import { registerTypes } from "../service-tests/setup";

const testContainer = registerTypes();

describe("edgedb base tests", () => {
  let edgeDbClient: Client;

  beforeAll(async () => {
    edgeDbClient = createClient({});
  });

  afterAll(() => {});

  beforeEach(async () => {
    await blankTestData();
    await insert10G();
  });

  it("root page is some sort of HTML", async () => {});
});
