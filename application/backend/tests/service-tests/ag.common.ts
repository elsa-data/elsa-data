import e, { storage } from "../../dbschema/edgeql-js";

/**
 * Will declare some mock test data here
 */

export const MOCK_S3_LIST_BUCKET_CLIENT = {
  Contents: [
    {
      Key: "Cardiac/2019-11-21/FILE_L001_R1.fastq.gz",
      LastModified: new Date(),
      ETag: '"ETAG_FASTQ_R1"',
      ChecksumAlgorithm: undefined,
      Size: 24791400277,
      StorageClass: "INTELLIGENT_TIERING",
      Owner: undefined,
    },
    {
      Key: "Cardiac/2019-11-21/FILE_L001_R2.fastq.gz",
      LastModified: new Date(),
      ETag: '"ETAG_FASTQ_R2"',
      ChecksumAlgorithm: undefined,
      Size: 24791400277,
      StorageClass: "INTELLIGENT_TIERING",
      Owner: undefined,
    },
    {
      Key: "Cardiac/2019-11-21/manifest.txt",
      LastModified: new Date(),
      ETag: '"ETAG_MANIFEST"',
      ChecksumAlgorithm: undefined,
      Size: 24791400277,
      StorageClass: "INTELLIGENT_TIERING",
      Owner: undefined,
    },
  ],
  ContinuationToken: undefined,
  Delimiter: undefined,
  EncodingType: undefined,
  IsTruncated: false,
  KeyCount: 3,
  MaxKeys: 1000,
  Name: "agha-gdr-store-2.0",
  NextContinuationToken: undefined,
  Prefix: "Cardiac",
  StartAfter: undefined,
};

export const MOCK_CARDIAC_S3_OBJECT_LIST = [
  {
    key: "Cardiac/2019-11-21/FILE_L001_R1.fastq.gz",
    eTag: '"ETAG_FASTQ_R1"',
    size: 24791400277,
  },
  {
    key: "Cardiac/2019-11-21/FILE_L001_R2.fastq.gz",
    eTag: '"ETAG_FASTQ_R2"',
    size: 24791400277,
  },
  {
    key: "Cardiac/2019-11-21/manifest.txt",
    eTag: '"ETAG_MANIFEST"',
    size: 24791400277,
  },
];

export const MOCK_CARDIAC_MANIFEST =
  `checksum\tfilename\tagha_study_id\n` +
  `CHECKSUM_FASTQ_R2\tFILE_L001_R1.fastq.gz\tA0000001\n` +
  `CHECKSUM_FASTQ_R1\tFILE_L001_R2.fastq.gz\tA0000001\n`;

export const MOCK_MANIFEST_OBJECT = [
  {
    checksum: "CHECKSUM_FASTQ_R2",
    filename: "FILE_L001_R1.fastq.gz",
    agha_study_id: "A0000001",
  },
  {
    checksum: "CHECKSUM_FASTQ_R1",
    filename: "FILE_L001_R2.fastq.gz",
    agha_study_id: "A0000001",
  },
];

export const MOCK_S3URL_MANIFEST_OBJECT = [
  {
    checksum: "CHECKSUM_FASTQ_R2",
    s3Url: "s3://agha-gdr-store-2.0/Cardiac/2019-11-21/FILE_L001_R1.fastq.gz",
    agha_study_id: "A0000001",
  },
  {
    checksum: "CHECKSUM_FASTQ_R1",
    s3Url: "s3://agha-gdr-store-2.0/Cardiac/2019-11-21/FILE_L001_R2.fastq.gz",
    agha_study_id: "A0000001",
  },
];

// Mock some FileRecord dataset here
export const MOCK_FILE_RECORD_TEMPLATE = {
  url: "s3://bucket/some/random/filename",
  size: 10,
  checksums: [
    {
      type: storage.ChecksumType.MD5,
      value: "RANDOMCHECKSUM",
    },
  ],
};

export const MOCK_FASTQ_FORWARD_FILE_RECORD = {
  ...MOCK_FILE_RECORD_TEMPLATE,
  url: "s3://agha-gdr-store-2.0/Cardiac/2019-11-21/FILE_L001_R1.fastq.gz",
};
export const MOCK_FASTQ_REVERSE_FILE_RECORD = {
  ...MOCK_FILE_RECORD_TEMPLATE,
  url: "s3://agha-gdr-store-2.0/Cardiac/2019-11-21/FILE_L001_R2.fastq.gz",
};

export const MOCK_FASTQ_PAIR_FILE_SET = [
  MOCK_FASTQ_FORWARD_FILE_RECORD,
  MOCK_FASTQ_REVERSE_FILE_RECORD,
];

export const MOCK_BAM_FILE_RECORD = {
  ...MOCK_FILE_RECORD_TEMPLATE,
  url: "s3://agha-gdr-store-2.0/Cardiac/2019-11-21/A0000001.bam",
};
export const MOCK_BAI_FILE_RECORD = {
  ...MOCK_FILE_RECORD_TEMPLATE,
  url: "s3://agha-gdr-store-2.0/Cardiac/2019-11-21/A0000001.bam.bai",
};

export const MOCK_BAM_FILE_SET = [MOCK_BAM_FILE_RECORD, MOCK_BAI_FILE_RECORD];

export const MOCK_VCF_FILE_RECORD = {
  ...MOCK_FILE_RECORD_TEMPLATE,
  url: "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/19W001062.individual.norm.vcf.gz",
};
export const MOCK_TBI_FILE_RECORD = {
  ...MOCK_FILE_RECORD_TEMPLATE,
  url: "s3://agha-gdr-store-2.0/Cardiac/2020-01-22/19W001062.individual.norm.vcf.gz.tbi",
};

export const MOCK_VCF_FILE_SET = [MOCK_VCF_FILE_RECORD, MOCK_TBI_FILE_RECORD];
