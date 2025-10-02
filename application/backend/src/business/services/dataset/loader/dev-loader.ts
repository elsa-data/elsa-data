import type { Executor } from "gel";
import type { Logger } from "pino";
import { type DependencyContainer, inject, injectable } from "tsyringe";
import {
  synchroniseDatasetControl,
  synchroniseDatasetKaos,
} from "../../../../../dbschema/queries";
import { TENF_URI } from "../../../../test-data/dataset/insert-test-data-10f-helpers.ts";
import { insert10F } from "../../../../test-data/dataset/insert-test-data-10f.ts";
import {
  insert10G,
  TENG_URI,
} from "../../../../test-data/dataset/insert-test-data-10g.ts";
import {
  CONTROL_DATASET_DOI,
  CONTROL_DATASET_URI,
} from "../../../../test-data/dataset/test-data-control.ts";
import {
  KAOS_DATASET_DOI,
  KAOS_DATASET_URI,
} from "../../../../test-data/dataset/test-data-kaos.ts";

/**
 * The DevLoader is a class wrapping triggered of loads of "dev" datasets.
 *
 * It must only be used by other Services, and only where the operations/params
 * are known to be valid/allowed. That is, these methods would never
 * be called with unchecked data from the internet (unless the method
 * explicitly says that it can handle it).
 */
@injectable()
export class DevLoader {
  constructor(
    @inject("DependencyContainer") private readonly dc: DependencyContainer,
    @inject("Logger") private readonly logger: Logger,
  ) {}

  public async synchroniseDataset(
    executor: Executor,
    devDatasetUri: string,
  ): Promise<void> {
    switch (devDatasetUri) {
      case TENG_URI:
        await insert10G(this.dc);
        break;
      case TENF_URI:
        await insert10F(this.dc);
        break;
      case KAOS_DATASET_URI:
        await synchroniseDatasetKaos(executor, {
          datasetDoi: KAOS_DATASET_DOI,
          datasetUri: KAOS_DATASET_URI,
        });
        break;
      case CONTROL_DATASET_URI:
        await synchroniseDatasetControl(executor, {
          datasetDoi: CONTROL_DATASET_DOI,
          datasetUri: CONTROL_DATASET_URI,
        });
        break;
      default:
        this.logger.error(
          `Dataset with URI ->${devDatasetUri}<- is not a dev dataset and so no actual loading has been performed`,
        );
    }
  }
}
