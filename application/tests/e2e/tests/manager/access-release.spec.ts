import { test, expect } from "@playwright/test";
import { managerSetup } from "./manager.common";
import * as fs from "fs";
import * as Seven from "node-7z";

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
      /https:\/\/umccr-10f-data-dev\.s3\.ap-southeast-2\.amazonaws\.com\//i
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
    const splitLines = data.split("\n");

    // Test if TSV is downloaded and contain S3 URI
    expect(data).toMatch(/s3:\/\/umccr-10f-data-dev\//i);

    // Test if "ELROY" data exist, as only one of the trio is selected in this release
    expect(splitLines[1]).toMatch(
      "JETSONS\tELROY\tGM24631\t1\ts3\tumccr-10f-data-dev\tCHINESE/JETSONSHG002-HG003-HG004.joint.filter.vcf.gz\ts3://umccr-10f-data-dev/CHINESE/JETSONSHG002-HG003-HG004.joint.filter.vcf.gz\tVCF\t721970cb30906405d4045f702ca72376"
    );
  });
});
