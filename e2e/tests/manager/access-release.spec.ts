import { test, expect } from "@playwright/test";
import { managerSetup } from "./manager.common";

test("Download AWS manifest ZIP", async ({ page }) => {
  await managerSetup(page);

  await page.locator("#button-view-R001").click();
  await page.getByText("Object Signing").click();

  const promiseDownload = page.waitForEvent("download");
  await page.getByText("Download Zip").click();
  const download = await promiseDownload;

  expect(download.suggestedFilename()).toBe("manifest-R001.zip");
});
