import { insertTestData } from "./test-data/insert-test-data";
import { getFromEnv } from "./entrypoint-command-helper";

export async function commandAddScenario(scenario: number): Promise<number> {
  const settings = await getFromEnv();

  await insertTestData(settings);

  return 0;
}
