import { chromium, FullConfig } from "@playwright/test";

/**
 * The global setup for local testing uses our 'dev only' login
 * page that allows direct button login for 3 different roles.
 *
 * @param config
 */
async function globalSetup(config: FullConfig) {
  const { baseURL, storageState } = config.projects[0].use;
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(baseURL! + "/dev-bm3ey56");
  await page.click("text=/data owner/");
  await page.context().storageState({ path: storageState as string });
  await browser.close();
}

export default globalSetup;
