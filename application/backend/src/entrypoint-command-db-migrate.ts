import { getFromEnv } from "./entrypoint-command-helper";
import { promisify } from "util";
import { execFile } from "child_process";

export const DB_MIGRATE_COMMAND = "db-migrate";

/**
 * A command that instructs EdgeDb to do migrations.
 */
export async function commandDbMigrate(): Promise<number> {
  const settings = await getFromEnv();

  const execFilePromise = promisify(execFile);

  try {
    const args = ["migration", "apply"];

    console.log(`Executing edgedb CLI`);

    const promiseInvoke = execFilePromise("/app/backend/edgedb", args, {
      maxBuffer: 1024 * 1024 * 64,
    });

    const { stdout, stderr } = await promiseInvoke;

    console.log(`Error code = ${promiseInvoke.child.exitCode}`);

    if (stdout) {
      stdout.split("\n").forEach((l) => console.log(`stdout ${l}`));
    }
    if (stderr) {
      stderr.split("\n").forEach((l) => console.log(`stderr ${l}`));
    }
  } catch (e) {
    console.error("edgedb migration apply failed");
    console.error(e);

    return 1;
  }

  return 0;
}
