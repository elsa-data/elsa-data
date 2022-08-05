// must be first and before any DI is used
import "reflect-metadata";

import { App } from "./app";
import { getSettings } from "./bootstrap-settings";
import { insertTestData } from "./test-data/insert-test-data";
import { blankTestData } from "./test-data/blank-test-data";
import archiver from "archiver";
import archiverZipEncrypted from "archiver-zip-encrypted";
import Bree from "bree";
import { container } from "tsyringe";
import { Client } from "edgedb";
import * as edgedb from "edgedb";
import { registerTypes } from "./bootstrap-container";
import path from "path";
import i18n from "i18n";
import { getConfig } from "./config/config-schema";
import { ElsaSettings } from "./config/elsa-settings";

console.log("Creating Fastify app");

// global settings for archiver
{
  // register format for archiver
  // note: only do it once per Node.js process/application, as duplicate registration will throw an error
  archiver.registerFormat("zip-encrypted", archiverZipEncrypted);
}

// global settings for bree (job scheduler)
{
  Bree.extend(require("@breejs/ts-worker"));
}

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

/*i18n.configure({
  locales: ['en', 'el'],
  defaultLocale: 'en',
  queryParameter: 'lang',
  directory: path.join('./', 'locales'),
  api: {
    '__': 'translate',
    '__n': 'translateN'
  },
}); */

// global settings for DI
registerTypes();

const start = async () => {
  console.log("Locating secrets/settings");

  const settings = await getSettings(["mac"]);

  container.register<ElsaSettings>("Settings", {
    useValue: settings,
  });

  await blankTestData();
  await insertTestData(settings);

  console.log("Starting job queue");

  await bree.start();

  const app = new App("local", () => ({ ...settings }));

  const server = await app.setupServer();

  console.log(`Listening on port ${settings.port}`);

  try {
    await server.listen(settings.port);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

(async () => {
  await start();
})();
