import { blankTestData } from "./test-data/util/blank-test-data";
import { Logger } from "pino";

export const DB_BLANK_COMMAND = "db-blank";

/**
 * Command indicating that the entire db content should be blanked.
 */
export async function commandDbBlank(logger: Logger): Promise<number> {
  // TODO a better mechanism here which *would* allow us to blank the prod database - but only if
  //      extra per instance details such as hostname are passed in e.g. db-blank elsa.umccr.org
  if (process.env.NODE_ENV !== "development") {
    logger.fatal(
      "The database can only be blanked when NODE_ENV is development",
    );

    return 1;
  }

  await blankTestData();

  // return a command status code of 0 to indicate success
  return 0;
}
