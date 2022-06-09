import * as edgedb from "edgedb";
import e, { lab } from "../../dbschema/edgeql-js";
import {
  createArtifacts,
  makeEmptyIdentifierArray,
  makeSystemlessIdentifierArray,
  createFile,
} from "./insert-test-data-helpers";

const edgeDbClient = edgedb.createClient();

/**
 * The 10G dataset is a subset of the 1000 genomes data but artificially put into a structure
 * to test specific areas of data sharing.
 */
export async function insert10G() {
  const makeCase = async (
    patientId: string,
    specimenId: string,
    bamSize: number,
    bamEtag: string,
    bamMd5: string,
    vcfSize: number,
    vcfEtag: string
  ) => {
    return e.insert(e.dataset.DatasetCase, {
      externalIdentifiers: makeEmptyIdentifierArray(),
      patients: e.insert(e.dataset.DatasetPatient, {
        externalIdentifiers: makeSystemlessIdentifierArray(patientId),
        specimens: e.insert(e.dataset.DatasetSpecimen, {
          externalIdentifiers: makeEmptyIdentifierArray(),
          artifacts: await createArtifacts(
            createFile(
              `s3://umccr-10g-data-dev/${specimenId}/${specimenId}.hard-filtered.vcf.gz`,
              vcfSize,
              vcfEtag
            ),
            createFile(
              `s3://umccr-10g-data-dev/${specimenId}/${specimenId}.hard-filtered.vcf.gz.tbi`,
              0
            ),
            createFile(
              `s3://umccr-10g-data-dev/${specimenId}/${specimenId}.bam`,
              bamSize,
              bamEtag,
              bamMd5
            ),
            createFile(
              `s3://umccr-10g-data-dev/${specimenId}/${specimenId}.bam.bai`,
              0
            ),
            []
          ),
        }),
      }),
    });
  };

  const teng = await e
    .insert(e.dataset.Dataset, {
      // temp rename this to match an existing REMS application
      uri: "http://cci.org.au/datasets/BOWEL",
      // uri: "urn:fdc:umccr.org:2022:dataset/10g",
      externalIdentifiers: makeSystemlessIdentifierArray("10G"),
      description: "UMCCR 10G",
      cases: e.set(
        await makeCase(
          "SINGLETONCHARLES",
          "HG00096",
          51808533335,
          "bfce3cfa4f0265866fae8f7a653cca95-3089", // pragma: allowlist secret
          "63f2b3c6b87c66d114f1e9bae8c35091", // pragma: allowlist secret
          425745911,
          ""
        ),
        await makeCase(
          "SINGLETONMARY",
          "HG00097",
          51388476731,
          "06b1c646338fa079dd6d7cb5f9dd67ed-3063", // pragma: allowlist secret
          "a6e072e3831fbdad4b790b9655d03301", // pragma: allowlist secret
          432160352,
          ""
        ),
        await makeCase(
          "SINGLETONJANE",
          "HG00099",
          60287609330,
          "",
          "",
          438966719,
          ""
        ),
        await makeCase(
          "SINGLETONKAARINA",
          "HG00171",
          58384944597,
          "",
          "",
          437251295,
          ""
        ),
        await makeCase(
          "SINGLETONANNELI",
          "HG00173",
          48040087199,
          "",
          "",
          429780695,
          ""
        ),
        await makeCase(
          "SINGLETONMARIA",
          "HG00174",
          54237781415,
          "",
          "",
          434759056,
          ""
        ),
        await makeCase(
          "SINGLETONMELE",
          "HG01810",
          50762049781,
          "",
          "",
          419758367,
          ""
        ),
        await makeCase(
          "SINGLETONPELANI",
          "HG01811",
          50858843268,
          "",
          "",
          419339818,
          ""
        ),
        await makeCase(
          "SINGLETONDEMBO",
          "HG03432",
          55219679614,
          "",
          "",
          534880969,
          ""
        ),
        await makeCase(
          "SINGLETONPAKUTEH",
          "HG03433",
          60896676023,
          "",
          "",
          540694003,
          ""
        )
      ),
    })
    .run(edgeDbClient);
}
