import { App } from "./app";
import { insertTestData } from "./test-data/insert-test-data";
import { blankTestData } from "./test-data/blank-test-data";
import Bree from "bree";
import { container } from "tsyringe";
import path from "path";
import { ElsaSettings } from "./config/elsa-settings";
import { sleep } from "edgedb/dist/utils";
import { getFromEnv } from "./entrypoint-command-helper";

export const WEB_SERVER_COMMAND = "web-server";
export const WEB_SERVER_WITH_SCENARIO_COMMAND = "web-server-with-scenario";

export async function startWebServer(scenario: number | null): Promise<number> {
  const settings = await getFromEnv();

  container.register<ElsaSettings>("Settings", {
    useValue: settings,
  });

  if (scenario) {
    await blankTestData();
    // TODO allow different scenarios to be inserted based on the value
    await insertTestData(settings);
  }

  console.log("Starting job queue");

  const bree = new Bree({
    root: path.resolve("jobs"),
    jobs: [
      {
        name: "select-job.ts",
        timeout: "5s",
        interval: "20s",
      },
    ],
  });

  await bree.start();

  const app = new App(settings);

  const server = await app.setupServer();

  console.log(`Listening on port ${settings.port}`);

  try {
    await server.listen({ port: settings.port });

    // TODO detect close() event from the server
    // TODO possibly replace Bree with our own direct Jobs query and handle that here
    while (true) {
      await sleep(5000);
    }
  } catch (err) {
    server.log.error(err);

    return 1;
  }
}
