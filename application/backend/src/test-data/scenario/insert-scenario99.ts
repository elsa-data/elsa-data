import { DependencyContainer } from "tsyringe";
import { getServices } from "../../di-helpers";

import { insertUser1 } from "../user/insert-user1";
import { insertUser2 } from "../user/insert-user2";
import { insertUser3 } from "../user/insert-user3";
import { blankTestData } from "../util/blank-test-data";
import { insertUser4 } from "../user/insert-user4";

/**
 * Inserting a set of data in scenario 99.

 * This scenario is essentially empty part from users to login.
 *
 * @param dc
 */
export async function insertScenario99(dc: DependencyContainer) {
  const { logger, edgeDbClient } = getServices(dc);

  // clear all records if any before filling it up
  await blankTestData();

  // some user records created - these are the users that can be used by login bypass
  const superAdmin = await insertUser1(dc);
  const administrator = await insertUser2(dc);
  const manager = await insertUser3(dc);
  const member = await insertUser4(dc);
}
