import { Page } from "@playwright/test";

export async function managerSetup(page: Page) {
  await page.goto("/login");
  await page.click("text=/Manager/");
  await page.goto("./");
}
