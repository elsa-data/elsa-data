import type { PlaywrightTestConfig } from "@playwright/test";
import { devices } from "@playwright/test";
import { resolve } from "path";

/**
 * See https://playwright.dev/docs/test-configuration.
 */
const config: PlaywrightTestConfig = {
  testDir: "./tests",
  globalTimeout: 360 * 1000,
  /* Maximum time one test can run for. */
  timeout: 30 * 1000,
  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toHaveText();`
     */
    timeout: 10000,
  },
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: "html",
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: 0,
    baseURL: "http://localhost:3000",
    storageState: "state.json",
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
  },

  /* test across a set of browsers */
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    //{
    //  name: "webkit",
    //  use: {
    //    ...devices["Desktop Safari"],
    //  },
    //},
  ],

  outputDir: "test-results/",

  globalSetup: require.resolve("./global-setup"),

  /* set up so our test server runs directly from dev */
  webServer: {
    cwd: "../application/backend",
    command:
      "node --loader ts-node/esm src/entrypoint.ts web-server-with-scenario 1",
    timeout: 2 * 60 * 1000,
    port: 3000,
    // there should be nothing running on our port in CI
    reuseExistingServer: !process.env.CI,
    // specific config for localhost testing
    env: {
      DEBUG: "pw:webserver",
      NODE_ENV: "development",
      ELSA_DATA_VERSION: "e2e",
      ELSA_DATA_BUILT: "now",
      ELSA_DATA_REVISION: "abcd",
      ELSA_DATA_META_CONFIG_SOURCES: "file('e2e') file('datasets')",
      ELSA_DATA_META_CONFIG_FOLDERS: resolve("config"),
    },
  },
};

export default config;
