import { Page } from "@playwright/test";

export async function administratorSetup(page: Page) {
  await page.goto("/login");
  await page.click("text=/Administrator/");
}
