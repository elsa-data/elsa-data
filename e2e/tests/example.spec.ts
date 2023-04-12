import { test, expect } from "@playwright/test";

test("homepage has title and links to intro page", async ({ page }) => {
  await page.goto("./");

  // expect the title
  await expect(page).toHaveTitle(/Elsa Data/);

  // because we are not logged in we get some text to show Releases
  await expect(page.getByRole("heading", { name: "Releases" })).toBeVisible();
});
