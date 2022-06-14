import { App } from "./app";
import { getLocalSettings } from "./bootstrap-settings";
import { insertTestData } from "./test-data/insert-test-data";
import { blankTestData } from "./test-data/blank-test-data";

console.log("Creating Fastify app");

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
