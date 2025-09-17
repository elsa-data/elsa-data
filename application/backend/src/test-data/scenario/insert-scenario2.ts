import type { DependencyContainer } from "tsyringe";
import { DevLoader } from "../../business/services/dataset/loader/dev-loader.ts";
import { UserService } from "../../business/services/user-service";
import { getServices } from "../../di-helpers";
import { insertUser1 } from "../user/insert-user1";
import { insertUser2 } from "../user/insert-user2";
import { insertUser3 } from "../user/insert-user3";
import { insertUser4 } from "../user/insert-user4";
import { insertUser5 } from "../user/insert-user5";

/**
 * Inserting a set of data in scenario 2

 * It consists mainly of datasets and releases for integration with CTRL.
 *
 * @param dc
 */
export async function insertScenario2(dc: DependencyContainer) {
  const { logger, edgeDbClient, settings } = getServices(dc);

  // Some user records created
  const superAdmin = await insertUser1(dc);
  const administrator = await insertUser2(dc);
  const manager = await insertUser3(dc);
  const member = await insertUser4(dc);
  const datasetAdministrator = await insertUser5(dc);

  const userService = dc.resolve(UserService);

  const datasetAdministratorUser = await userService.getBySubjectId(
    datasetAdministrator.subjectId,
  );

  if (!datasetAdministratorUser)
    throw new Error("Basic scenario users are missing");

  const devLoader = dc.resolve(DevLoader);

  await devLoader.synchroniseDataset(
    edgeDbClient,
    "urn:doi:10.example-not-real/kaos",
  );
}
