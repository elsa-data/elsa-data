import { DatasetService } from "./business/services/dataset-service";
import { DependencyContainer } from "tsyringe";
import { getServices } from "./di-helpers";
import { insert10G, TENG_URI } from "./test-data/dataset/insert-test-data-10g";
import { TENF_URI } from "./test-data/dataset/insert-test-data-10f-helpers";
import { insert10F } from "./test-data/dataset/insert-test-data-10f";

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
  datasetUriArray: string[]
): Promise<number> {
  const { settings } = getServices(dc);
  const datasetsService = dc.resolve(DatasetService);

  // no point in doing a dataset twice so put into a set
  const datasetUriSet = new Set<string>(datasetUriArray);

  for (const datasetUri of datasetUriSet) {
    let didLoad = false;

    for (const configuredDataset of settings.datasets ?? []) {
      if (configuredDataset.uri === datasetUri) {
        didLoad = true;

        console.log(
          `Starting sync for ->${datasetUri}<- using loader ${configuredDataset.loader}`
        );

        switch (configuredDataset.loader) {
          case "australian-genomics-directories-demo":
            break;
          case "australian-genomics-directories":
            break;
          case "dev":
            switch (configuredDataset.uri) {
              case TENG_URI:
                await insert10G(dc);
                break;
              case TENF_URI:
                await insert10F(dc);
                break;
              default:
                console.log(
                  `Dataset URI ${
                    (configuredDataset.uri as any).loader
                  } is not a dev dataset`
                );
            }
            break;
          default:
            console.log(
              `Loader type ${(configuredDataset as any).loader} not known`
            );
        }
      }
    }

    if (!didLoad) {
      console.log(
        `Did not perform a sync for ->${datasetUri}<- as it was not listed in the configuration`
      );
    }
  }

  return 0;
}
