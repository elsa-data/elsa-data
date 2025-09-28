import type { DependencyContainer } from "tsyringe";
import { DevLoader } from "./business/services/dataset/loader/dev-loader.ts";
import { getServices } from "./di-helpers";
// import { S3IndexApplicationService } from "./business/services/australian-genomics/s3-index-import-service.xts";

export const SYNC_DATASETS_COMMAND = "sync-datasets";

/**
 * Command instructing us to bring our concept of the given
 * dataset up to date.
 *
 * @param dc the dependency container
 * @param datasetUriArray An array of URIs for datasets to sync
 */
export async function commandSyncDatasets(
  dc: DependencyContainer,
  datasetUriArray: string[],
): Promise<number> {
  const { settings, logger, edgeDbClient } = getServices(dc);
  // const agIndexService = dc.resolve(S3IndexApplicationService); TO BE datasetFormatLoader = dc.resolve(
  const devLoader = dc.resolve(DevLoader);

  // no point in doing a dataset twice - even if the user lists them twice - so we put the input into a set
  // to remove duplicates
  const datasetUriSet = new Set<string>(datasetUriArray);

  for (const datasetUri of datasetUriSet) {
    let didLoad = false;

    for (const configuredDataset of settings.datasets ?? []) {
      if (configuredDataset.uri === datasetUri) {
        didLoad = true;

        logger.info(
          `Starting synchronisation for dataset with URI ->${datasetUri}<- using loader ->${configuredDataset.loader}<-`,
        );

        switch (configuredDataset.loader) {
          case "australian-genomics-directories":
            throw new Error("Was implemented but now deprecated");
            //await agIndexService.syncWithDatabaseFromDatasetUri(
            //  datasetUri,
            //  configuredDataset,
            //);
            break;
          case "pfdl":
            // await agIndexService.syncWithDatabaseFromDatasetUri(
            //   datasetUri,
            //  configuredDataset,
            // );
            throw new Error("Not implemented yet");
            break;
          case "dev":
            await devLoader.synchroniseDataset(
              edgeDbClient,
              configuredDataset.uri,
            );
            break;
          default:
            logger.error(
              `Dataset loader type ->${(configuredDataset as any).loader}<- is not known`,
            );
        }
      }
    }

    if (!didLoad) {
      logger.warn(
        `Did not perform a synchronisation for dataset with URI ->${datasetUri}<- as it was not listed in the configuration`,
      );
    }
  }

  return 0;
}
