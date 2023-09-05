import { executeEdgeCli } from "./entrypoint-helper";

export const DB_WIPE_COMMAND = "db-wipe";

/**
 * A command that instructs EdgeDb to do database wipe.
 */
export async function commandDbWipe(): Promise<number> {
  if (process.env.NODE_ENV !== "development") {
    console.log("The database can only be wiped when NODE_ENV is development");

    return 1;
  }

  try {
    await executeEdgeCli(["database", "wipe", "--non-interactive"]);

    return 0;
  } catch (e) {
    console.error("edgedb database wipe failed");
    console.error(e);

    return 1;
  }
}
