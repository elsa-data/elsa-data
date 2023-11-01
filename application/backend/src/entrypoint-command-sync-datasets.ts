import { DatasetService } from "./business/services/dataset-service";
import { DependencyContainer } from "tsyringe";
import { getServices } from "./di-helpers";
import { insert10G, TENG_URI } from "./test-data/dataset/insert-test-data-10g";
import { TENF_URI } from "./test-data/dataset/insert-test-data-10f-helpers";
import { insert10F } from "./test-data/dataset/insert-test-data-10f";
import { S3IndexApplicationService } from "./business/services/australian-genomics/s3-index-import-service";

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
  const { settings, logger } = getServices(dc);
  const agIndexService = dc.resolve(S3IndexApplicationService);

  // no point in doing a dataset twice - even if the user lists them twice - so put the input into a set
  const datasetUriSet = new Set<string>(datasetUriArray);

  for (const datasetUri of datasetUriSet) {
    let didLoad = false;

    for (const configuredDataset of settings.datasets ?? []) {
      if (configuredDataset.uri === datasetUri) {
        didLoad = true;

        logger.info(
          `Starting sync for ->${datasetUri}<- using loader ${configuredDataset.loader}`,
        );

        switch (configuredDataset.loader) {
          case "australian-genomics-directories":
            await agIndexService.syncWithDatabaseFromDatasetUri(
              datasetUri,
              "australian-genomics-directories",
            );
            break;
          case "dev":
            // I guess we could restrict this loader to literally dev only (we could do a check here) - but this
            // whole code section is
            // only executable by system administrators - and I guess they might have a good
            // reason to do this in prod(?) - so no check for now
            switch (configuredDataset.uri) {
              case TENG_URI:
                await insert10G(dc);
                break;
              case TENF_URI:
                await insert10F(dc);
                break;
              default:
                logger.error(
                  `Dataset URI ${
                    (configuredDataset.uri as any).loader
                  } is not a dev dataset`,
                );
            }
            break;
          default:
            logger.error(
              `Loader type ${(configuredDataset as any).loader} not known`,
            );
        }
      }
    }

    if (!didLoad) {
      logger.warn(
        `Did not perform a sync for ->${datasetUri}<- as it was not listed in the configuration`,
      );
    }
  }

  return 0;
}
