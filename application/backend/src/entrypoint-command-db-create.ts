import type { Logger } from "pino";
import { executeGelCli } from "./entrypoint-helper";

export const DB_CREATE_COMMAND = "db-create";

/**
 * A command that instructs EdgeDb to do database create.
 */
export async function commandDbCreate(logger: Logger): Promise<number> {
  // the database is fixed by the deployment - but may not actually
  // exist in the instance
  // so we get its name and tell gel to create
  const dbName = process.env["GEL_DATABASE"];

  if (!dbName) {
    logger.fatal("gel 'database create' failed");
    logger.fatal("No GEL_DATABASE environment variable");

    return 1;
  }

  try {
    // we need to delete the EDGE DB database env variables - as the edge db CLI tries to connect
    // to it before then trying to create it
    await executeGelCli(
      logger,
      ["database", "create", dbName],
      ["GEL_DATABASE"],
    );

    return 0;
  } catch (e) {
    logger.fatal(e, `Database create of '${dbName}'`);

    return 1;
  }
}
