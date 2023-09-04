import { executeEdgeCli } from "./entrypoint-helper";

export const DB_MIGRATE_COMMAND = "db-migrate";

/**
 * A command that instructs EdgeDb to do migrations.
 */
export async function commandDbMigrate(): Promise<number> {
  try {
    await executeEdgeCli(["migration", "apply"]);

    return 0;
  } catch (e) {
    console.error("edgedb migration apply failed");
    console.error(e);

    return 1;
  }
}
