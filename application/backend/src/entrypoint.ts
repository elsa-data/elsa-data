// must be first and before any DI is used
import "reflect-metadata";

import { App } from "./app";
import { bootstrapSettings } from "./bootstrap-settings";
import { insertTestData } from "./test-data/insert-test-data";
import { blankTestData } from "./test-data/blank-test-data";
import Bree from "bree";
import { container } from "tsyringe";
import { bootstrapDependencyInjection } from "./bootstrap-dependency-injection";
import path from "path";
import { ElsaSettings } from "./config/elsa-settings";
import { oneOffCommonInitialiseSynchronous } from "./bootstrap-common-once";
import { getMetaConfig } from "./config/config-schema";
import { CONFIG_SOURCES_ENVIRONMENT_VAR } from "./config/config-constants";
import { DatasetService } from "./business/services/dataset-service";

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
bootstrapDependencyInjection();

const start = async () => {
  const metaSources = process.env[CONFIG_SOURCES_ENVIRONMENT_VAR];

  if (!metaSources)
    throw new Error(
      `For local development launch there must be a env variable ${CONFIG_SOURCES_ENVIRONMENT_VAR} set to the source of configurations`
    );

  const settings = await bootstrapSettings(await getMetaConfig(metaSources));

  container.register<ElsaSettings>("Settings", {
    useValue: settings,
  });
  await blankTestData();
  await insertTestData(settings);

  // DB Setup
  // Dataset in the configuration are being initialized here.
  const datasetsService = container.resolve(DatasetService);
  for (const dp of settings.datasets) {
    await datasetsService.selectOrInsertDataset({
      datasetDescription: dp.description,
      datasetName: dp.name,
      datasetUri: dp.uri,
    });
  }

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
