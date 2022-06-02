import * as edgedb from "edgedb";
import e, { lab } from "../../dbschema/edgeql-js";
import {
  File,
  createArtifacts,
  makeEmptyIdentifierArray,
  makeSystemlessIdentifierArray,
} from "./insert-test-data-helpers";

const client = edgedb.createClient();

const VCF_FILE_TEST_DATA: File = {
  name: "19W001062.individual.norm.vcf.gz",
  url: "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/19W001062.individual.norm.vcf.gz",
  size: 0,
  checksums: [
    {
      type: lab.ChecksumType.MD5,
      value: "721970cb30906405d4045f702ca72376",
    },
  ],
};

const VCF_INDEX_FILE_TEST_DATA: File = {
  name: "19W001062.individual.norm.vcf.gz",
  url: "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/19W001062.individual.norm.vcf.gz.tbi",
  size: 0,
  checksums: [
    {
      type: lab.ChecksumType.MD5,
      value: "721970cb30906405d4045f702ca72376",
    },
  ],
};

const BAM_FILE_TEST_DATA: File = {
  name: "19W001062.bam",
  url: "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/19W001062.bam",
  size: 0,
  checksums: [
    {
      type: lab.ChecksumType.MD5,
      value: "721970cb30906405d4045f702ca72376",
    },
  ],
};

const BAM_INDEX_FILE_TEST_DATA: File = {
  name: "19W001062.bam",
  url: "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/19W001062.bam.bai",
  size: 0,
  checksums: [
    {
      type: lab.ChecksumType.MD5,
      value: "721970cb30906405d4045f702ca72376",
    },
  ],
};

const FASTQ_FILE_TEST_DATA: File[][] = [
  [
    {
      name: "191001_A00692_0027_TL1909260_19W001062_MAN-20190926_NEXTERAFLEXWGS_L002",
      url: "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/191001_A00692_0027_TL1909260_19W001062_MAN-20190926_NEXTERAFLEXWGS_L002_R1.fastq.gz",
      size: 0,
      checksums: [
        {
          type: lab.ChecksumType.MD5,
          value: "721970cb30906405d4045f702ca72376",
        },
      ],
    },
    {
      name: "191001_A00692_0027_TL1909260_19W001062_MAN-20190926_NEXTERAFLEXWGS_L002",
      url: "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/191001_A00692_0027_TL1909260_19W001062_MAN-20190926_NEXTERAFLEXWGS_L002_R2.fastq.gz",
      size: 0,
      checksums: [
        {
          type: lab.ChecksumType.MD5,
          value: "721970cb30906405d4045f702ca72376",
        },
      ],
    },
  ],
  [
    {
      name: "191011_A00692_0028_TL1909260_19W001062_MAN-20190926_NEXTERAFLEXWGS_L001",
      url: "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/191011_A00692_0028_TL1909260_19W001062_MAN-20190926_NEXTERAFLEXWGS_L001_R1.fastq.gz",
      size: 0,
      checksums: [
        {
          type: lab.ChecksumType.MD5,
          value: "721970cb30906405d4045f702ca72376",
        },
      ],
    },
    {
      name: "191011_A00692_0028_TL1909260_19W001062_MAN-20190926_NEXTERAFLEXWGS_L001",
      url: "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/191011_A00692_0028_TL1909260_19W001062_MAN-20190926_NEXTERAFLEXWGS_L001_R2.fastq.gz",
      size: 0,
      checksums: [
        {
          type: lab.ChecksumType.MD5,
          value: "721970cb30906405d4045f702ca72376",
        },
      ],
    },
  ],
  [
    {
      name: "191011_A00692_0028_TL1909260_19W001062_MAN-20190926_NEXTERAFLEXWGS_L002",
      url: "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/191011_A00692_0028_TL1909260_19W001062_MAN-20190926_NEXTERAFLEXWGS_L001_R1.fastq.gz",
      size: 0,
      checksums: [
        {
          type: lab.ChecksumType.MD5,
          value: "721970cb30906405d4045f702ca72376",
        },
      ],
    },
    {
      name: "191011_A00692_0028_TL1909260_19W001062_MAN-20190926_NEXTERAFLEXWGS_L002",
      url: "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/191011_A00692_0028_TL1909260_19W001062_MAN-20190926_NEXTERAFLEXWGS_L001_R2.fastq.gz",
      size: 0,
      checksums: [
        {
          type: lab.ChecksumType.MD5,
          value: "721970cb30906405d4045f702ca72376",
        },
      ],
    },
  ],
  [
    {
      name: "191011_A00692_0028_TL1909260_19W001062_MAN-20190926_NEXTERAFLEXWGS_L003",
      url: "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/191011_A00692_0028_TL1909260_19W001062_MAN-20190926_NEXTERAFLEXWGS_L003_R1.fastq.gz",
      size: 0,
      checksums: [
        {
          type: lab.ChecksumType.MD5,
          value: "721970cb30906405d4045f702ca72376",
        },
      ],
    },
    {
      name: "191011_A00692_0028_TL1909260_19W001062_MAN-20190926_NEXTERAFLEXWGS_L003",
      url: "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/191011_A00692_0028_TL1909260_19W001062_MAN-20190926_NEXTERAFLEXWGS_L003_R2.fastq.gz",
      size: 0,
      checksums: [
        {
          type: lab.ChecksumType.MD5,
          value: "721970cb30906405d4045f702ca72376",
        },
      ],
    },
  ],
];

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
                  VCF_FILE_TEST_DATA,
                  VCF_INDEX_FILE_TEST_DATA,
                  BAM_FILE_TEST_DATA,
                  BAM_INDEX_FILE_TEST_DATA,
                  FASTQ_FILE_TEST_DATA
                ),
              })
            ),
          }),
        })
      ),
    })
    .run(client);
}
