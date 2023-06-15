import e from "../../../dbschema/edgeql-js";
import { DependencyContainer } from "tsyringe";
import { getServices } from "../../di-helpers";
import { makeSystemlessIdentifierArray } from "../util/test-data-helpers";

export const SMARTIE_URI = "urn:example:elsa-data-demo-dataset-smartie";

export const SMARTIE_FAKE_BUCKET = "elsa-data-demo-datasets";

export const SMARTIE_FAKE_KEY = "Smartie";

export const SMARTIE_FAKE_S3_PREFIX = `s3://${SMARTIE_FAKE_BUCKET}/${SMARTIE_FAKE_KEY}`;

export const SMARTIE_NAME = "Smartie Study";

export const SMARTIE_DESCRIPTION = "Mini and mitochondrial - the Smartie study";

/**
 * The Smartie dataset is mini and mitochondrial data
 */
export async function insertSmartie(dc: DependencyContainer): Promise<string> {
  const { edgeDbClient } = getServices(dc);

  const tenc = await e
    .insert(e.dataset.Dataset, {
      uri: SMARTIE_URI,
      externalIdentifiers: makeSystemlessIdentifierArray("Smartie"),
      description: SMARTIE_DESCRIPTION,
      cases: e.set(),
    })
    .run(edgeDbClient);

  // TODO to an update to the index from our filesystem version of Smartie

  return SMARTIE_URI;
}
