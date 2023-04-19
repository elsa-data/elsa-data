import { test, expect } from "@playwright/test";

test("A release can be created manually which has selectable cases", async ({
  page,
}) => {
  await page.goto("./");

  await page.getByRole("listitem").filter({ hasText: "DAC" }).click();
  await page.getByRole("tab", { name: "Manual Entry" }).click();
  await page.getByRole("button", { name: "Enter Release Details" }).click();

  await page.getByPlaceholder("Release Title").click();
  await page.getByPlaceholder("Release Title").fill("My release title");

  await page.getByPlaceholder("Release Description").click();
  await page
    .getByPlaceholder("Release Description")
    .fill("My release description");

  await page.locator(".css-art2ul-ValueContainer2").click(); // Expand the dataset dropdown

  await page
    .locator("#datasetUriSelector > div")
    .getByText("urn:fdc:umccr.org:2022:dataset/10c")
    .click();
  await page
    .locator("#datasetUriSelector > div")
    .getByText("urn:fdc:umccr.org:2022:dataset/10f")
    .click();

  await page
    .locator("#datasetUriSelector > div")
    .getByText("urn:fdc:umccr.org:2022:dataset/10g")
    .click();

  await page.keyboard.press("Escape");

  await page.getByLabel("General Research Use").check();

  await page.getByPlaceholder("Applicant Email Address(es)").click();
  await page
    .getByPlaceholder("Applicant Email Address(es)")
    .fill("myemail@example.com");

  await page.getByRole("button", { name: "Create" }).click();

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
  await page.getByText("T908765").click();
  await page.getByText("T657567").click();
  await page.getByText("NA24143").click();

  // Active the release
  await page.getByRole("button", { name: "Activate Release" }).first().click();

  // Check that the release is active
  await expect(
    page.getByText("Data sharing is activated for this release")
  ).toBeVisible();
});
