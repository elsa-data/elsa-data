import { DatasetService } from "./business/services/dataset-service";
import { DependencyContainer } from "tsyringe";
export const DELETE_DATASETS_COMMAND = "delete-dataset";

/**
 * Command instructing to delete datasets and hierarchical records from database.
 * This ideally should not be executed.
 *
 * @param dc the dependency container
 * @param datasetUriArray An array of unique dataset
 */
export async function commandDeleteDataset(
  dc: DependencyContainer,
  datasetUriArray: string[]
): Promise<number> {
  // Insert config datasets where does not appear in Db
  const datasetsService = dc.resolve(DatasetService);
  for (const datasetUri of datasetUriArray) {
    await datasetsService.deleteDataset({ datasetUri: datasetUri });
  }

  return 0;
}
