import { test, expect } from "@playwright/test";
import { managerSetup } from "./manager.common";
import fs from "fs";
import Seven from "node-7z";

const RELEASE_KEY = "R001";

// A setup that logged the test as a manager in release `R001`
test.beforeEach(async ({ page }) => {
  await managerSetup(page);
});

test("Download AWS PresignedUrl ZIP files", async ({ page }) => {
  const dirPath = "./test-results/download/test-aws-presigned/";

  await page.locator(`#button-view-${RELEASE_KEY}`).click();
  await page.getByText("Object Signing").click();

  const downloadPromise = page.waitForEvent("download");
  await page.getByText("Download Zip").click();
  const download = await downloadPromise;

  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toBe(`manifest-${RELEASE_KEY}.zip`);
  const zipPath = `${dirPath}${suggestedFilename}`;
  await download.saveAs(zipPath);

  const stream = Seven.extract(zipPath, dirPath, {
    password: "abcd",
  });
  stream.on("data", (sevenData: { file: string } & Record<string, string>) => {
    const extractedPath = `${dirPath}${sevenData.file}`;

    const manifestData = fs.readFileSync(extractedPath, {
      encoding: "utf8",
      flag: "r",
    });
    expect(manifestData).toMatch(
      /https:\/\/umccr-10f-data-dev.s3.ap-southeast-2.amazonaws.com\//i
    );
  });
});

test("Download metadata manifest ZIP file", async ({ page }) => {
  // Navigate and download file
  await page.locator(`#button-view-${RELEASE_KEY}`).click();
  await page.getByRole("tab", { name: "Manifest" }).click();

  const downloadPromise = page.waitForEvent("download");
  await page.getByText("Download TSV").click();
  const download = await downloadPromise;

  // Open the downloaded file
  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toBe(`manifest-${RELEASE_KEY}.tsv`);

  const readableStream = await download.createReadStream();
  let data = "";
  readableStream?.on("data", (chunk) => {
    data += chunk;
  });

  // Reading the data from the stream
  readableStream?.on("end", () => {
    expect(data).toMatch(/s3:\/\/umccr-10f-data-dev\//i);
  });
});
