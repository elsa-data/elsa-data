import * as edgedb from "edgedb";
import e from "../../dbschema/edgeql-js";
import {
  createArtifacts,
  makeEmptyIdentifierArray,
  makeSystemlessIdentifierArray,
} from "./insert-test-data-helpers";

const client = edgedb.createClient();

export async function insertCARDIAC() {
  await e
    .insert(e.dataset.Dataset, {
      uri: "urn:fdc:australiangenomics.org.au:2022:datasets/cardiac",
      description: "Australian Genomics cardiac flagship",
      externalIdentifiers: makeSystemlessIdentifierArray("CARDIAC"),
      cases: e.set(
        e.insert(e.dataset.DatasetCase, {
          externalIdentifiers: makeEmptyIdentifierArray(),
          patients: e.insert(e.dataset.DatasetPatient, {
            externalIdentifiers: makeSystemlessIdentifierArray("19W001062"),
            specimens: e.set(
              e.insert(e.dataset.DatasetSpecimen, {
                externalIdentifiers: makeEmptyIdentifierArray(),
                artifacts: await createArtifacts(
                  "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/19W001062.individual.norm.vcf.gz",
                  0,
                  "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/19W001062.individual.norm.vcf.gz.tbi",
                  "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/19W001062.bam",
                  0,
                  "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/19W001062.bam.bai",
                  [
                    [
                      "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/191001_A00692_0027_TL1909260_19W001062_MAN-20190926_NEXTERAFLEXWGS_L002_R1.fastq.gz",
                      "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/191001_A00692_0027_TL1909260_19W001062_MAN-20190926_NEXTERAFLEXWGS_L002_R2.fastq.gz",
                      0,
                      0,
                    ],
                    [
                      "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/191011_A00692_0028_TL1909260_19W001062_MAN-20190926_NEXTERAFLEXWGS_L001_R1.fastq.gz",
                      "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/191011_A00692_0028_TL1909260_19W001062_MAN-20190926_NEXTERAFLEXWGS_L001_R2.fastq.gz",
                      0,
                      0,
                    ],
                    [
                      "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/191011_A00692_0028_TL1909260_19W001062_MAN-20190926_NEXTERAFLEXWGS_L002_R1.fastq.gz",
                      "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/191011_A00692_0028_TL1909260_19W001062_MAN-20190926_NEXTERAFLEXWGS_L002_R2.fastq.gz",
                      0,
                      0,
                    ],
                    [
                      "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/191011_A00692_0028_TL1909260_19W001062_MAN-20190926_NEXTERAFLEXWGS_L003_R1.fastq.gz",
                      "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/191011_A00692_0028_TL1909260_19W001062_MAN-20190926_NEXTERAFLEXWGS_L003_R2.fastq.gz",
                      0,
                      0,
                    ],
                  ]
                ),
              })
            ),
          }),
        }),
        e.insert(e.dataset.DatasetCase, {
          externalIdentifiers: makeEmptyIdentifierArray(),
          patients: e.insert(e.dataset.DatasetPatient, {
            externalIdentifiers: makeSystemlessIdentifierArray("19W001063"),
            specimens: e.set(
              e.insert(e.dataset.DatasetSpecimen, {
                externalIdentifiers: makeEmptyIdentifierArray(),
                artifacts: await createArtifacts(
                  "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/19W001063.individual.norm.vcf.gz",
                  0,
                  "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/19W001063.individual.norm.vcf.gz.tbi",
                  "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/19W001063.bam",
                  0,
                  "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/19W001063.bam.bai",
                  [
                    [
                      "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/191011_A00692_0028_TL1909261_19W001063_MAN-20190926_NEXTERAFLEXWGS_L001_R1.fastq.gz",
                      "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/191011_A00692_0028_TL1909261_19W001063_MAN-20190926_NEXTERAFLEXWGS_L001_R2.fastq.gz",
                      0,
                      0,
                    ],
                    [
                      "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/191011_A00692_0028_TL1909261_19W001063_MAN-20190926_NEXTERAFLEXWGS_L002_R1.fastq.gz",
                      "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/191011_A00692_0028_TL1909261_19W001063_MAN-20190926_NEXTERAFLEXWGS_L002_R2.fastq.gz",
                      0,
                      0,
                    ],
                    [
                      "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/191011_A00692_0028_TL1909261_19W001063_MAN-20190926_NEXTERAFLEXWGS_L003_R1.fastq.gz",
                      "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/191011_A00692_0028_TL1909261_19W001063_MAN-20190926_NEXTERAFLEXWGS_L003_R2.fastq.gz",
                      0,
                      0,
                    ],
                  ]
                ),
              })
            ),
          }),
        }),
        e.insert(e.dataset.DatasetCase, {
          externalIdentifiers: makeEmptyIdentifierArray(),
          patients: e.insert(e.dataset.DatasetPatient, {
            externalIdentifiers: makeSystemlessIdentifierArray("19W001134"),
            specimens: e.set(
              e.insert(e.dataset.DatasetSpecimen, {
                externalIdentifiers: makeEmptyIdentifierArray(),
                artifacts: await createArtifacts(
                  "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/19W001134.individual.norm.vcf.gz",
                  0,
                  "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/19W001134.individual.norm.vcf.gz.tbi",
                  "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/19W001134.bam",
                  0,
                  "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/19W001134.bam.bai",
                  [
                    [
                      "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/191025_A00692_0030_TL1909928_19W001134_MAN-20191018_NEXTERAFLEXWGS_L001_R1.fastq.gz",
                      "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/191025_A00692_0030_TL1909928_19W001134_MAN-20191018_NEXTERAFLEXWGS_L001_R2.fastq.gz",
                      0,
                      0,
                    ],
                    [
                      "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/191025_A00692_0030_TL1909928_19W001134_MAN-20191018_NEXTERAFLEXWGS_L002_R1.fastq.gz",
                      "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/191025_A00692_0030_TL1909928_19W001134_MAN-20191018_NEXTERAFLEXWGS_L002_R2.fastq.gz",
                      0,
                      0,
                    ],
                    [
                      "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/191025_A00692_0030_TL1909928_19W001134_MAN-20191018_NEXTERAFLEXWGS_L003_R1.fastq.gz",
                      "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/191025_A00692_0030_TL1909928_19W001134_MAN-20191018_NEXTERAFLEXWGS_L003_R2.fastq.gz",
                      0,
                      0,
                    ],
                    [
                      "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/191025_A00692_0030_TL1909928_19W001134_MAN-20191018_NEXTERAFLEXWGS_L004_R1.fastq.gz",
                      "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/191025_A00692_0030_TL1909928_19W001134_MAN-20191018_NEXTERAFLEXWGS_L004_R2.fastq.gz",
                      0,
                      0,
                    ],
                  ]
                ),
              })
            ),
          }),
        })
      ),
    })
    .run(client);
}
