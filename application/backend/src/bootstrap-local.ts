import { App } from "./app";
import { getLocalSettings } from "./bootstrap-settings";
import { insertTestData } from "./test-data/insert-test-data";
import { blankTestData } from "./test-data/blank-test-data";
import archiver from "archiver";
import archiverZipEncrypted from "archiver-zip-encrypted";

console.log("Creating Fastify app");

// register format for archiver
// note: only do it once per Node.js process/application, as duplicate registration will throw an error
archiver.registerFormat("zip-encrypted", archiverZipEncrypted);

const start = async () => {
  console.log("Locating secrets/settings");

  const settings = await getLocalSettings();

  await blankTestData();
  await insertTestData(settings);

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
