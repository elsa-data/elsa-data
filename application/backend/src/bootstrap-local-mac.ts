// must be first and before any DI is used
import "reflect-metadata";

import { App } from "./app";
import { getSettings } from "./bootstrap-settings";
import { insertTestData } from "./test-data/insert-test-data";
import { blankTestData } from "./test-data/blank-test-data";
import Bree from "bree";
import { container } from "tsyringe";
import { registerTypes } from "./bootstrap-container";
import path from "path";
import { ElsaEnvironment, ElsaSettings } from "./config/elsa-settings";
import { oneOffCommonInitialiseSynchronous } from "./bootstrap-common-once";

oneOffCommonInitialiseSynchronous();

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

// global settings for DI
registerTypes();

const start = async () => {
  // other parts of the node env are going to trigger off this setting so to a certain
  // extent we will too
  const environment: ElsaEnvironment =
    process.env.NODE_ENV === "production" ? "production" : "development";

  const settings = await getSettings(environment, "local-mac");

  container.register<ElsaSettings>("Settings", {
    useValue: settings,
  });

  await blankTestData();
  await insertTestData(settings);

  console.log("Starting job queue");

  await bree.start();

  const app = new App(settings);

  const server = await app.setupServer();

  console.log(`Listening on port ${settings.port}`);

  try {
    await server.listen({ port: settings.port });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

(async () => {
  await start();
})();
