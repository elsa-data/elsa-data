import { App } from "../../src/app";
import { getLocalSettings } from "../../src/bootstrap-settings";
import { FastifyInstance } from "fastify";
import { Client, createClient } from "edgedb";
import { blankTestData } from "../../src/test-data/insert-test-data";

describe("edgedb base tests", () => {
  let edgeDbClient: Client;

  beforeAll(async () => {
    edgeDbClient = createClient({});
  });

  afterAll(() => {});

  it("root page is some sort of HTML", async () => {
    await blankTestData();
  });
});
