import * as edgedb from "edgedb";
import e from "../../dbschema/edgeql-js";
import { insertCARDIAC } from "./insert-test-data-cardiac";
import {
  createArtifacts,
  makeEmptyIdentifierArray,
  makeSystemlessIdentifier,
  makeSystemlessIdentifierArray,
} from "./insert-test-data-helpers";

const client = edgedb.createClient();

/**
 * The 10G dataset is a subset of the 1000 genomes data but artificially put into a structure
 * to test specific areas of data sharing.
 */
export async function insert10G() {
  const makeCase = async (patientId: string, specimenId: string) => {
    return e.insert(e.dataset.DatasetCase, {
      externalIdentifiers: makeEmptyIdentifierArray(),
      patients: e.insert(e.dataset.DatasetPatient, {
        externalIdentifiers: makeSystemlessIdentifierArray(patientId),
        specimens: e.insert(e.dataset.DatasetSpecimen, {
          externalIdentifiers: makeEmptyIdentifierArray(),
          artifacts: await createArtifacts(
            `s3://umccr-10g-data-dev/${specimenId}/${specimenId}.hard-filtered.vcf.gz`,
            `s3://umccr-10g-data-dev/${specimenId}/${specimenId}.hard-filtered.vcf.gz.tbi`,
            `s3://umccr-10g-data-dev/${specimenId}/${specimenId}.bam`,
            `s3://umccr-10g-data-dev/${specimenId}/${specimenId}.bam.bai`,
            []
          ),
        }),
      }),
    });
  };

  const teng = await e
    .insert(e.dataset.Dataset, {
      externalIdentifiers: makeSystemlessIdentifierArray("10G"),
      description: "UMCCR 10G",
      cases: e.set(
        await makeCase("SINGLETONCHARLES", "HG00096"),
        await makeCase("SINGLETONMARY", "HG00097"),
        await makeCase("SINGLETONJANE", "HG00099"),
        await makeCase("SINGLETONKAARINA", "HG00171"),
        await makeCase("SINGLETONANNELI", "HG00173"),
        await makeCase("SINGLETONMARIA", "HG00174"),
        await makeCase("SINGLETONMELE", "HG01810"),
        await makeCase("SINGLETONPELANI", "HG01811"),
        await makeCase("SINGLETONDEMBO", "HG03432"),
        await makeCase("SINGLETONPAKUTEH", "HG03433")
      ),
    })
    .run(client);
}
