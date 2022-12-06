import { insertTestData } from "./test-data/insert-test-data";
import { getFromEnv } from "./entrypoint-command-helper";

export const ADD_SCENARIO_COMMAND = "add-scenario";

/**
 * Command instructing that a given test scenario should be added into the Elsa database.
 *
 * @param scenario
 */
export async function commandAddScenario(scenario: number): Promise<number> {
  const { settings } = await getFromEnv();

  // TODO make multiple scenarios
  await insertTestData(settings);

  return 0;
}
