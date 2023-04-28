import { test, expect } from "@playwright/test";
import { managerSetup } from "./manager.common";

const RELEASE_KEY = "R001";

test.beforeEach(async ({ page }) => {
  await managerSetup(page);
});

test("Download AWS PresignedUrl ZIP files", async ({ page }) => {
  await page.locator(`#button-view-${RELEASE_KEY}`).click();
  await page.getByText("Object Signing").click();

  const downloadPromise = page.waitForEvent("download");
  await page.getByText("Download Zip").click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe(`manifest-${RELEASE_KEY}.zip`);
});

test("Download metadata manifest ZIP file", async ({ page }) => {
  await page.locator(`#button-view-${RELEASE_KEY}`).click();
  await page.getByRole("tab", { name: "Manifest" }).click();

  const downloadPromise = page.waitForEvent("download");
  await page.getByText("Download Zip").click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe(`manifest-${RELEASE_KEY}.zip`);
});
