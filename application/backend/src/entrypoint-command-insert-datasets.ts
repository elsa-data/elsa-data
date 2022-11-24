import { getFromEnv } from "./entrypoint-command-helper";
import { container } from "tsyringe";
import { DatasetService } from "./business/services/dataset-service";
export const INSERT_CONFIG_DATASETS_COMMAND = "insert-config-datasets";

/**
 * Command instructing to insert datasets from config file.
 */
export async function commandInsertConfigDatasets(): Promise<number> {
  const settings = await getFromEnv();

  // Insert config datasets where does not appear in Db
  const datasetsService = container.resolve(DatasetService);
  for (const dp of settings.datasets) {
    await datasetsService.selectOrInsertDataset({
      datasetDescription: dp.description,
      datasetName: dp.name,
      datasetUri: dp.uri,
    });
  }

  return 0;
}
