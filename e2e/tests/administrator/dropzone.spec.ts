import { expect } from "@playwright/test";
import { administratorSetup } from "./administrator.common";
import { test } from "../custom-base-test";

test.beforeEach(async ({ page }) => {
  await administratorSetup(page);
});

test("Upload (un)select CSV", async ({ page }) => {
  await page
    .getByRole("row", {
      name: "A Working Release of Data on Google Storage R005 GS Administrator",
    })
    .getByRole("button", { name: "view" })
    .click();

  // CSV string
  const csvString = "specimen_id\nDUCK\nHG7";
  const inputFile = {
    name: "my.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(csvString),
  };

  // Wait for dropzones to attach to the DOM then select them
  await page.waitForSelector('input[type="file"]', { state: "attached" });
  const [selectInputElement, unselectInputElement] = await page.$$(
    'input[type="file"]'
  );

  // These checkboxes will go from being unchecked to being checked and back again
  const hg7 = await page.getByText("HG7");
  const hg9 = await page.getByText("HG97");

  // This checkbox will remain unchecked
  const na2 = await page.getByText("NA24149");

  await expect
    .poll(async () => hg7.isChecked(), { timeout: 30000 })
    .toBeFalsy();
  await expect
    .poll(async () => hg9.isChecked(), { timeout: 30000 })
    .toBeFalsy();
  await expect
    .poll(async () => na2.isChecked(), { timeout: 30000 })
    .toBeFalsy();

  // Attach CSV to "select" dropzone
  await selectInputElement.setInputFiles(inputFile);

  await expect
    .poll(async () => hg7.isChecked(), { timeout: 30000 })
    .toBeTruthy();
  await expect
    .poll(async () => hg9.isChecked(), { timeout: 30000 })
    .toBeTruthy();
  await expect
    .poll(async () => na2.isChecked(), { timeout: 30000 })
    .toBeFalsy();

  // Attach CSV to "unselect" dropzone
  await unselectInputElement.setInputFiles(inputFile);

  await expect
    .poll(async () => hg7.isChecked(), { timeout: 30000 })
    .toBeFalsy();
  await expect
    .poll(async () => hg9.isChecked(), { timeout: 30000 })
    .toBeFalsy();
  await expect
    .poll(async () => na2.isChecked(), { timeout: 30000 })
    .toBeFalsy();
});
