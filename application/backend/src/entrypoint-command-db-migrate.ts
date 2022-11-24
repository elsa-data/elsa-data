import { getFromEnv } from "./entrypoint-command-helper";

export const DB_MIGRATE_COMMAND = "db-migrate";

/**
 * A command that instructs EdgeDb to do migrations.
 */
export async function commandDbMigrate(): Promise<number> {
  const settings = await getFromEnv();

  throw Error("not implemented");
}
