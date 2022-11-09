import { AG_CARDIAC_FLAGSHIP } from "@umccr/elsa-types";
import * as edgedb from "edgedb";
import e, { lab, storage } from "../../dbschema/edgeql-js";
import {
  File,
  createArtifacts,
  makeEmptyIdentifierArray,
  makeSystemlessIdentifierArray,
} from "./test-data-helpers";

const client = edgedb.createClient();

interface DataSet {
  study_id: string;
  vcf_file: File;
  tbi_file: File;
  bam_file: File;
  bai_file: File;
  fastq_pair: File[][];
}

/******************************************************************************
 * TEST DATA SET
 *****************************************************************************/

const createMockFileFromName = (name: string): File => {
  return {
    url: name,
    size: 0,
    checksums: [
      {
        type: storage.ChecksumType.MD5,
        value: "00000000000000000000000000000000",
      },
    ],
  };
};
const DATASET_1: DataSet = {
  study_id: "19W001062",
  vcf_file: createMockFileFromName(
    "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/19W001062.individual.norm.vcf.gz"
  ),
  tbi_file: createMockFileFromName(
    "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/19W001062.individual.norm.vcf.gz.tbi"
  ),
  bam_file: createMockFileFromName(
    "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/19W001062.bam"
  ),
  bai_file: createMockFileFromName(
    "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/19W001062.bam.bai"
  ),
  fastq_pair: [
    [
      createMockFileFromName(
        "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/191001_A00692_0027_TL1909260_19W001062_MAN-20190926_NEXTERAFLEXWGS_L002_R1.fastq.gz"
      ),
      createMockFileFromName(
        "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/191001_A00692_0027_TL1909260_19W001062_MAN-20190926_NEXTERAFLEXWGS_L002_R2.fastq.gz"
      ),
    ],
    [
      createMockFileFromName(
        "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/191011_A00692_0028_TL1909260_19W001062_MAN-20190926_NEXTERAFLEXWGS_L001_R1.fastq.gz"
      ),
      createMockFileFromName(
        "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/191011_A00692_0028_TL1909260_19W001062_MAN-20190926_NEXTERAFLEXWGS_L001_R2.fastq.gz"
      ),
    ],
    [
      createMockFileFromName(
        "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/191011_A00692_0028_TL1909260_19W001062_MAN-20190926_NEXTERAFLEXWGS_L003_R1.fastq.gz"
      ),
      createMockFileFromName(
        "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/191011_A00692_0028_TL1909260_19W001062_MAN-20190926_NEXTERAFLEXWGS_L003_R2.fastq.gz"
      ),
    ],
  ],
};

const DATASET_2: DataSet = {
  study_id: "19W001063",
  vcf_file: createMockFileFromName(
    "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/19W001063.individual.norm.vcf.gz"
  ),
  tbi_file: createMockFileFromName(
    "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/19W001063.individual.norm.vcf.gz.tbi"
  ),
  bam_file: createMockFileFromName(
    "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/19W001063.bam"
  ),
  bai_file: createMockFileFromName(
    "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/19W001063.bam.bai"
  ),
  fastq_pair: [
    [
      createMockFileFromName(
        "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/191011_A00692_0028_TL1909261_19W001063_MAN-20190926_NEXTERAFLEXWGS_L001_R1.fastq.gz"
      ),
      createMockFileFromName(
        "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/191011_A00692_0028_TL1909261_19W001063_MAN-20190926_NEXTERAFLEXWGS_L001_R2.fastq.gz"
      ),
    ],
    [
      createMockFileFromName(
        "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/191011_A00692_0028_TL1909261_19W001063_MAN-20190926_NEXTERAFLEXWGS_L002_R1.fastq.gz"
      ),
      createMockFileFromName(
        "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/191011_A00692_0028_TL1909261_19W001063_MAN-20190926_NEXTERAFLEXWGS_L002_R2.fastq.gz"
      ),
    ],
    [
      createMockFileFromName(
        "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/191011_A00692_0028_TL1909261_19W001063_MAN-20190926_NEXTERAFLEXWGS_L003_R1.fastq.gz"
      ),
      createMockFileFromName(
        "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/191011_A00692_0028_TL1909261_19W001063_MAN-20190926_NEXTERAFLEXWGS_L003_R2.fastq.gz"
      ),
    ],
  ],
};

const DATASET_3: DataSet = {
  study_id: "19W001134",
  vcf_file: createMockFileFromName(
    "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/19W001134.individual.norm.vcf.gz"
  ),
  tbi_file: createMockFileFromName(
    "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/19W001134.individual.norm.vcf.gz.tbi"
  ),
  bam_file: createMockFileFromName(
    "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/19W001134.bam"
  ),
  bai_file: createMockFileFromName(
    "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/19W001134.bam.bai"
  ),
  fastq_pair: [
    [
      createMockFileFromName(
        "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/191025_A00692_0030_TL1909928_19W001134_MAN-20191018_NEXTERAFLEXWGS_L001_R1.fastq.gz"
      ),
      createMockFileFromName(
        "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/191025_A00692_0030_TL1909928_19W001134_MAN-20191018_NEXTERAFLEXWGS_L001_R2.fastq.gz"
      ),
    ],
    [
      createMockFileFromName(
        "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/191025_A00692_0030_TL1909928_19W001134_MAN-20191018_NEXTERAFLEXWGS_L002_R1.fastq.gz"
      ),
      createMockFileFromName(
        "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/191025_A00692_0030_TL1909928_19W001134_MAN-20191018_NEXTERAFLEXWGS_L002_R2.fastq.gz"
      ),
    ],
    [
      createMockFileFromName(
        "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/191025_A00692_0030_TL1909928_19W001134_MAN-20191018_NEXTERAFLEXWGS_L003_R1.fastq.gz"
      ),
      createMockFileFromName(
        "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/191025_A00692_0030_TL1909928_19W001134_MAN-20191018_NEXTERAFLEXWGS_L003_R2.fastq.gz"
      ),
    ],
    [
      createMockFileFromName(
        "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/191025_A00692_0030_TL1909928_19W001134_MAN-20191018_NEXTERAFLEXWGS_L004_R1.fastq.gz"
      ),
      createMockFileFromName(
        "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/191025_A00692_0030_TL1909928_19W001134_MAN-20191018_NEXTERAFLEXWGS_L004_R2.fastq.gz"
      ),
    ],
  ],
};

/******************************************************************************
 * TEST DATA SET
 *****************************************************************************/

export async function insertCARDIAC() {
  await e
    .insert(e.dataset.Dataset, {
      uri: AG_CARDIAC_FLAGSHIP,
      description: "Australian Genomics cardiac flagship",
      externalIdentifiers: makeSystemlessIdentifierArray("CARDIAC"),
      cases: e.set(
        e.insert(e.dataset.DatasetCase, {
          externalIdentifiers: makeEmptyIdentifierArray(),
          patients: e.insert(e.dataset.DatasetPatient, {
            externalIdentifiers: makeSystemlessIdentifierArray(
              DATASET_1.study_id
            ),
            specimens: e.set(
              e.insert(e.dataset.DatasetSpecimen, {
                externalIdentifiers: makeEmptyIdentifierArray(),
                artifacts: await createArtifacts(
                  DATASET_1.vcf_file,
                  DATASET_1.tbi_file,
                  DATASET_1.bam_file,
                  DATASET_1.bai_file,
                  DATASET_1.fastq_pair
                ),
              })
            ),
          }),
        }),
        e.insert(e.dataset.DatasetCase, {
          externalIdentifiers: makeEmptyIdentifierArray(),
          patients: e.insert(e.dataset.DatasetPatient, {
            externalIdentifiers: makeSystemlessIdentifierArray(
              DATASET_2.study_id
            ),
            specimens: e.set(
              e.insert(e.dataset.DatasetSpecimen, {
                externalIdentifiers: makeEmptyIdentifierArray(),
                artifacts: await createArtifacts(
                  DATASET_2.vcf_file,
                  DATASET_2.tbi_file,
                  DATASET_2.bam_file,
                  DATASET_2.bai_file,
                  DATASET_2.fastq_pair
                ),
              })
            ),
          }),
        }),
        e.insert(e.dataset.DatasetCase, {
          externalIdentifiers: makeEmptyIdentifierArray(),
          patients: e.insert(e.dataset.DatasetPatient, {
            externalIdentifiers: makeSystemlessIdentifierArray(
              DATASET_3.study_id
            ),
            specimens: e.set(
              e.insert(e.dataset.DatasetSpecimen, {
                externalIdentifiers: makeEmptyIdentifierArray(),
                artifacts: await createArtifacts(
                  DATASET_3.vcf_file,
                  DATASET_3.tbi_file,
                  DATASET_3.bam_file,
                  DATASET_3.bai_file,
                  DATASET_3.fastq_pair
                ),
              })
            ),
          }),
        })
      ),
    })
    .run(client);
}
