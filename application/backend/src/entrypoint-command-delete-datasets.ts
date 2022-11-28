import { container } from "tsyringe";
import { DatasetService } from "./business/services/dataset-service";
export const DELETE_DATASETS_COMMAND = "delete-dataset";

/**
 * Command instructing to delete datasets and hierarchical records from database.
 * This ideally should not be executed.
 *
 * @param datasetUriArray An array of unique dataset
 */
export async function commandDeleteDataset(
  datasetUriArray: string[]
): Promise<number> {
  // Insert config datasets where does not appear in Db
  const datasetsService = container.resolve(DatasetService);
  for (const datasetUri of datasetUriArray) {
    await datasetsService.deleteDataset({ datasetUri: datasetUri });
  }

  return 0;
}
