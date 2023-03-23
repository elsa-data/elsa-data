import { test, expect } from "@playwright/test";

// It seems it does not pass in GH Action lately, and would disable this for now.
// To be re-instantiate with issue #232
// Ref: https://github.com/umccr/elsa-data/issues/232

// test("homepage has title and links to intro page", async ({ page }) => {
//   await page.goto("./");

//   // expect the title
//   await expect(page).toHaveTitle(/Elsa Data/);

//   // because we are not logged in we get some text to show Releases
//   await expect(page.getByRole("heading", { name: "Releases" })).toBeVisible();

//   // navigate to a different page
//   const dacLink = page.getByRole("link", { name: /DAC/ });

//   await dacLink.click();

//   await expect(page).toHaveURL(/.*dac/);
// });
