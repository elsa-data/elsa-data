import { executeEdgeCli } from "./entrypoint-helper";
import { Logger } from "pino";

export const DB_MIGRATE_COMMAND = "db-migrate";

/**
 * A command that instructs EdgeDb to do migrations.
 */
export async function commandDbMigrate(logger: Logger): Promise<number> {
  try {
    await executeEdgeCli(logger, ["migration", "apply"]);

    return 0;
  } catch (e) {
    logger.error(e, "Database migration");

    return 1;
  }
}
