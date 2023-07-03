import { expect } from "@playwright/test";
import { test } from "./custom-base-test";

test("homepage has title and links to intro page", async ({ page }) => {
  await page.goto("./");

  // expect the title
  await expect(page).toHaveTitle(/Elsa Data/);

  // general page Releases
  await expect(page.getByRole("heading", { name: "Releases" })).toBeVisible();

  // expect a table of releases including R0001
  await expect(page.getByRole("cell", { name: "R001" })).toBeVisible();
});
