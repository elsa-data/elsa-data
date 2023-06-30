import { test as base } from "@playwright/test";

/**
 * A common spot to customise our base test page.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    page.on("console", (msg) => {
      switch (msg.type()) {
        case "warning":
          throw new Error(`Warning in console:\n${msg.text()}`);
        case "error":
          throw new Error(`Error in console:\n${msg.text()}`);
      }
    });
    await use(page);
  },
});
