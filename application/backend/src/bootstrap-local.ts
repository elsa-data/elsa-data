import { App } from "./app";
import { getLocalSettings } from "./bootstrap-settings";
import { insertTestData } from "./test-data/insert-test-data";
import { blankTestData } from "./test-data/blank-test-data";
import archiver from "archiver";
import archiverZipEncrypted from "archiver-zip-encrypted";
import Bree from "bree";

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
  jobs: [
    {
      name: "short.ts",
      timeout: "10s",
      interval: "30s",
    },
  ],
});

const start = async () => {
  console.log("Locating secrets/settings");

  const settings = await getLocalSettings();

  await blankTestData();
  await insertTestData(settings);

  console.log("Starting job queue");

  await bree.start();

  const app = new App(() => ({ ...settings }));

  const PORT = 3000;

  const server = await app.setupServer();

  console.log(`Listening on port ${PORT}`);

  try {
    await server.listen(PORT);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

(async () => {
  await start();
})();
