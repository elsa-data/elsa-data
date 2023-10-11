import { executeEdgeCli } from "./entrypoint-helper";
import { Logger } from "pino";

export const DB_WIPE_COMMAND = "db-wipe";

/**
 * A command that instructs EdgeDb to do database wipe.
 */
export async function commandDbWipe(logger: Logger): Promise<number> {
  if (process.env.NODE_ENV !== "development") {
    logger.fatal("The database can only be wiped when NODE_ENV is development");

    return 1;
  }

  try {
    await executeEdgeCli(logger, ["database", "wipe", "--non-interactive"]);
  } catch (e) {
    logger.fatal(e, "Database wipe");

    return 1;
  }

  return 0;
}
