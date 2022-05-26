import { App } from "../../src/app";
import { getLocalSettings } from "../../src/bootstrap-settings";
import { FastifyInstance } from "fastify";

describe("http integration tests", () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    const settings = await getLocalSettings();

    const app = new App(settings);

    server = app.getServer();

    await server.ready();
  });

  afterAll(() => server.close());

  it("root page is some sort of HTML", async () => {
    const res = await server.inject({
      url: "/",
    });
    expect(res.body).toContain(`<html lang="en">`);
  });
});
