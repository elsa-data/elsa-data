import { DependencyContainer } from "tsyringe";
import { insertScenario1 } from "./test-data/scenario/insert-scenario1";

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
  if (scenario == 1) await insertScenario1(dc);

  return 0;
}
