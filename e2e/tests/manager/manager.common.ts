import { Page } from "@playwright/test";

export async function managerSetup(page: Page) {
  await page.goto("/dev-bm3ey56");
  await page.click("text=/Manager/");
  await page.goto("./");
}
