import { test, expect } from "@playwright/test";

test("homepage has title and links to intro page", async ({ page }) => {
  await page.goto("./");

  // expect the title
  await expect(page).toHaveTitle(/Elsa Data/);

  // because we are not logged in we get some text about showing releases
  await expect(page.getByText("shows any releases")).toBeVisible();

  // navigate to a different page
  const dacLink = page.getByRole("link", { name: /DAC/ });

  await dacLink.click();

  await expect(page).toHaveURL(/.*dac/);
});
