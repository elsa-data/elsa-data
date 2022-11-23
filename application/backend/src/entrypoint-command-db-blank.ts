import { blankTestData } from "./test-data/blank-test-data";

export async function commandDbBlank(): Promise<number> {
  await blankTestData();

  // return a command status code of 0 to indicate success
  return 0;
}
