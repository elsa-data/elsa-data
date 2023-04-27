import { test, expect } from "@playwright/test";
import { managerSetup } from "./manager.common";

const RELEASE_KEY = "R001";

test("Download AWS manifest ZIP", async ({ page }) => {
  await managerSetup(page);

  await page.locator(`#button-view-${RELEASE_KEY}`).click();
  await page.getByText("Object Signing").click();

  const [download] = await Promise.all([
    page.waitForEvent("download"), // Wait for the download to start
    await page.getByText("Download Zip").click(), // Click on the link that initiates the download
  ]);

  expect(download.suggestedFilename()).toBe(`manifest-${RELEASE_KEY}.zip`);
});
