import { test, expect } from "@playwright/test";
import { managerSetup } from "./manager.common";

const RELEASE_KEY = "R001";

test("Download AWS manifest ZIP", async ({ page }) => {
  test.slow();
  await managerSetup(page);

  await page.locator(`#button-view-${RELEASE_KEY}`).click();
  await page.getByText("Object Signing").click();

  const downloadPromise = page.waitForEvent("download");
  await page.getByText("Download Zip").click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe(`manifest-${RELEASE_KEY}.zip`);
});
