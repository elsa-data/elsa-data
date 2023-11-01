import { expect } from "@playwright/test";
import { managerSetup } from "./manager.common";
import { test } from "../custom-base-test";
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

  // Select at least the objectStoreSigned
  await page.locator("#chx-objectStoreSigned").check();

  const downloadPromise = page.waitForEvent("download");
  await page.getByText("Download Zip").click();
  const download = await downloadPromise;

  const suggestedFilename = download.suggestedFilename();
  expect(suggestedFilename).toBe(`manifest-${RELEASE_KEY}.zip`);
  const zipPath = `${dirPath}${suggestedFilename}`;
  await download.saveAs(zipPath);

  const stream = Seven.extract(zipPath, dirPath, {
    password: "ABCDEFGHIJKL",
  });
  stream.on("data", (sevenData: { file: string } & Record<string, string>) => {
    const extractedPath = `${dirPath}${sevenData.file}`;

    const manifestData = fs.readFileSync(extractedPath, {
      encoding: "utf8",
      flag: "r",
    });

    const splitLines = manifestData.trim().split("\n");

    const headerRow = splitLines.shift() ?? "";
    const headerNames = headerRow.split("\t");

    // Check the existence/non-existence of patient Ids
    const objectSignedIndex = headerNames.indexOf("OBJECTSTORESIGNED");
    const allSignedUrl = splitLines.map((each) => {
      const column = each.split("\t");
      return column[objectSignedIndex];
    });

    // Make sure for each line has the s3 presigned url
    for (const line of allSignedUrl) {
      expect(line).toMatch(
        /^https:\/\/umccr-10f-data-dev\.s3\.ap-southeast-2\.amazonaws\.com\//i,
      );
    }
  });
});

test("Download metadata manifest ZIP file and check for Patient Ids", async ({
  page,
}) => {
  // Navigate and download file
  await page.locator(`#button-view-${RELEASE_KEY}`).click();
  await page.getByRole("tab", { name: "Manifest" }).click();

  // Select at least the patientId
  await page.locator("#chx-patientId").check();

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
    const splitLines = data.trim().split("\n");

    const headerRow = splitLines.shift() ?? "";
    const headerNames = headerRow.split("\t");

    // Check the existence/non-existence of patient Ids
    const patientIdIndex = headerNames.indexOf("PATIENTID");
    const allPatientId = splitLines.map((each) => {
      const column = each.split("\t");
      return column[patientIdIndex];
    });

    // In the test-data scenario 1
    // The first ID for all three trios are: ELROY, ELROY_PAT, ELROY_MAT
    // The release will only include the "ELROY" patient only
    expect(allPatientId.includes("ELROY")).toBe(true);
    expect(allPatientId.includes("ELROY_PAT")).toBe(false);
    expect(allPatientId.includes("ELROY_MAT")).toBe(false);
  });
});
