import { Page } from "@playwright/test";

export async function superAdminSetup(page: Page) {
  await page.goto("/dev-bm3ey56");
  await page.click("text=/SuperAdmin/");
  await page.goto("./");
}
