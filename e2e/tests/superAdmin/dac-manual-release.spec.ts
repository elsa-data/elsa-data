import { expect } from "@playwright/test";
import { superAdminSetup } from "./superAdmin.common";
import { test } from "../custom-base-test";

test.beforeEach(async ({ page }) => {
  await superAdminSetup(page);
});

test("A release can be created manually which has selectable cases", async ({
  page,
}) => {
  await page.getByRole("listitem").filter({ hasText: "DAC" }).click();
  await page.getByRole("tab", { name: "Manual" }).click();
  await page.getByRole("button", { name: "Create Release Manually" }).click();

  await page.getByPlaceholder("Release Title").click();
  await page.getByPlaceholder("Release Title").fill("My release title");

  await page.getByPlaceholder("Release Description").click();
  await page
    .getByPlaceholder("Release Description")
    .fill("My release description");

  await page.locator(".css-art2ul-ValueContainer2").click(); // Expand the dataset dropdown

  await page.locator("#datasetSelector > div").getByText("10C").click();
  await page.locator("#datasetSelector > div").getByText("10F").click();

  await page.locator("#datasetSelector > div").getByText("10G").click();

  await page.keyboard.press("Escape");

  await page.getByLabel("General Research Use").check();

  await page.getByPlaceholder("Applicant Email Address(es)").click();
  await page
    .getByPlaceholder("Applicant Email Address(es)")
    .fill("myemail@example.com");

  await page.getByRole("button", { name: "Create", exact: true }).click();

  // We should now be on the new release's details page. We check that the data
  // we just entered is present in the new release.
  await expect(page.getByText("My release title")).toBeVisible();

  await expect(
    page.getByText("urn:fdc:umccr.org:2022:dataset/10c")
  ).toBeVisible();
  await expect(
    page.getByText("urn:fdc:umccr.org:2022:dataset/10f")
  ).toBeVisible();
  await expect(
    page.getByText("urn:fdc:umccr.org:2022:dataset/10g")
  ).toBeVisible();

  // Press 'See details of application'
  await page.locator("input").first().check();

  await expect(page.getByText("My release description")).toBeVisible();

  await expect(page.getByText("myemail@example.com")).toBeVisible();

  // Add some cases to the release
  const t9 = await page.getByText("T908765");
  await t9.click();
  await expect
    .poll(async () => t9.isChecked(), { timeout: 30000 })
    .toBeTruthy();

  const t6 = await page.getByText("T657567");
  await t6.click();
  await expect
    .poll(async () => t6.isChecked(), { timeout: 30000 })
    .toBeTruthy();

  const na2 = await page.getByText("NA24143");
  await na2.click();
  await expect
    .poll(async () => na2.isChecked(), { timeout: 30000 })
    .toBeTruthy();

  // we need for the AWS S3 to be selected in order that our release
  // has actual files to release
  {
    const s3 = await page.getByText("AWS S3");

    // expected to start false (this could easily change if we change the logic so don't be surprised if
    // it fails here and we instead change the test)
    expect(await s3.isChecked()).toBeFalsy();

    await s3.click();
    await expect
      .poll(async () => s3.isChecked(), { timeout: 30000 })
      .toBeTruthy();
  }

  // Activate the release
  await page.getByRole("button", { name: "Activate Release" }).first().click();

  // Check that the release is active
  await expect(
    page.getByText("Data sharing is activated for this release")
  ).toBeVisible();
});
