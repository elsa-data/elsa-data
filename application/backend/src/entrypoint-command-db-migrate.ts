import { getFromEnv } from "./entrypoint-command-helper";

export async function commandDbMigrate(): Promise<number> {
  const settings = await getFromEnv();

  throw Error("not implemented");
}
