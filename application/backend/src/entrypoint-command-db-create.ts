import { executeEdgeCli } from "./entrypoint-helper";

export const DB_CREATE_COMMAND = "db-create";

/**
 * A command that instructs EdgeDb to do database create.
 */
export async function commandDbCreate(): Promise<number> {
  // the database is fixed by the deployment - but may not actually
  // exist in the instance
  // so we get its name and tell edgedb to create
  const dbName = process.env["EDGEDB_DATABASE"];

  if (!dbName) {
    console.error("edgedb 'database create' failed");
    console.error("No EDGEDB_DATABASE environment variable");

    return 1;
  }

  try {
    // we need to delete the EDGE DB database env variables - as the edge db CLI tries to connect
    // to it before then trying to create it
    await executeEdgeCli(["database", "create", dbName], ["EDGEDB_DATABASE"]);

    return 0;
  } catch (e) {
    console.error(`edgedb 'database create ${dbName}' failed`);
    console.error(e);

    return 1;
  }
}
