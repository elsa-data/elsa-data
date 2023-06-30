import { Page } from "@playwright/test";

export async function superAdminSetup(page: Page) {
  await page.goto("/login");
  await page.click("text=/SuperAdmin/");
}
