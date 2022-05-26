import { App } from "./app";
import { getLocalSettings } from "./bootstrap-settings";
import { blankTestData, insertTestData } from "./test-data/insert-test-data";

console.log("Creating Fastify app");

const start = async () => {
  await blankTestData();
  await insertTestData();

  console.log("Locating secrets/settings");

  const settings = await getLocalSettings();

  const app = new App(settings);

  const PORT = 3000;

  console.log(`Listening on port ${PORT}`);

  try {
    await app.getServer().listen(PORT);
  } catch (err) {
    app.getServer().log.error(err);
    process.exit(1);
  }
};

(async () => {
  await start();
})();
