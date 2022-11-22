import { test, expect } from "@playwright/test";

test("homepage has title and links to intro page", async ({ page }) => {
  await page.goto("https://elsa.dev.umccr.org/");

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Elsa Data/);

  // create a locator
  const getStarted = page.getByRole("button", { name: "Log in via CILogon" });

  // Click the get started link.
  await getStarted.click();

  // Expects the URL to contain intro.
  await expect(page).toHaveURL(/.*authorize/);
});
