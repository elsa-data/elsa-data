import { test, expect } from "@playwright/test";

test("homepage has title and links to intro page", async ({ page }) => {
  await page.goto("./");

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Elsa Data/);

  // create a locator
  await expect(page.getByText("ROLE (IN RELEASE)")).toBeVisible();

  const dacLink = page.getByRole("link", { name: /DAC/ });

  await dacLink.click();

  await expect(page).toHaveURL(/.*dac/);
});
