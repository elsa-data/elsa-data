import { insertTestData } from "./test-data/insert-test-data";
import { getFromEnv } from "./entrypoint-command-helper";
import { DependencyContainer } from "tsyringe";

export const ADD_SCENARIO_COMMAND = "add-scenario";

/**
 * Command instructing that a given test scenario should be added into the Elsa database.
 *
 * @param dc
 * @param scenario
 */
export async function commandAddScenario(
  dc: DependencyContainer,
  scenario: number
): Promise<number> {
  // TODO make multiple scenarios
  await insertTestData(dc);

  return 0;
}
