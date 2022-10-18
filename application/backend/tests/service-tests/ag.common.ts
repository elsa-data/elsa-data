import e, { storage } from "../../dbschema/edgeql-js";

/**
 * Will declare some mock test data here
 */

export const MOCK_DATASET_URI =
  "urn:fdc:australiangenomics.org.au:2022:datasets/cardiac";
export const S3_URL_PREFIX = "s3://agha-gdr-store-2.0/Cardiac/2019-11-21";

function createS3ObjectList(key = "S3_KEY", etag = "AWS_ETAG", size = 1) {
  return {
    key: key,
    eTag: etag,
    size: size,
  };
}

function createManifestObject(
  filename = "FILE_L001_R1.fastq.gz",
  agha_study_id = "A0000001",
  checksum = "RANDOMCHECKSUM"
) {
  return {
    checksum: checksum,
    filename: filename,
    agha_study_id: agha_study_id,
  };
}

function createS3UrlManifestObject(
  s3Url = `${S3_URL_PREFIX}/FILE_L001_R1.fastq.gz`,
  agha_study_id = "A0000001",
  checksum = "RANDOMCHECKSUM"
) {
  return {
    checksum: checksum,
    s3Url: s3Url,
    agha_study_id: agha_study_id,
  };
}

// Template File Record dataset
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

// Mock data 1 - A pair of fastq pair
export const MOCK_1_CARDIAC_KEY_PREFIX = "Cardiac/2019-11-21/";
export const MOCK_1_CARDIAC_FASTQ1_FILENAME = "FILE_L001_R1.fastq.gz";
export const MOCK_1_CARDIAC_FASTQ2_FILENAME = "FILE_L001_R2.fastq.gz";
export const MOCK_1_CARDIAC_MANIFEST_FILENAME = "manifest.txt";
export const MOCK_1_STUDY_ID = "A0000001";
export const MOCK_1_CARDIAC_S3_OBJECT_LIST = [
  createS3ObjectList(
    `${MOCK_1_CARDIAC_KEY_PREFIX}${MOCK_1_CARDIAC_FASTQ1_FILENAME}`
  ),
  createS3ObjectList(
    `${MOCK_1_CARDIAC_KEY_PREFIX}${MOCK_1_CARDIAC_FASTQ2_FILENAME}`
  ),
  createS3ObjectList(
    `${MOCK_1_CARDIAC_KEY_PREFIX}${MOCK_1_CARDIAC_MANIFEST_FILENAME}`
  ),
];

export const MOCK_1_CARDIAC_MANIFEST =
  `checksum\tfilename\tagha_study_id\n` +
  `RANDOMCHECKSUM\tFILE_L001_R1.fastq.gz\tA0000001\n` +
  `RANDOMCHECKSUM\tFILE_L001_R2.fastq.gz\tA0000001\n`;

export const MOCK_1_MANIFEST_OBJECT = [
  createManifestObject(MOCK_1_CARDIAC_FASTQ1_FILENAME),
  createManifestObject(MOCK_1_CARDIAC_FASTQ2_FILENAME),
];

export const MOCK_1_S3URL_MANIFEST_OBJECT = [
  createS3UrlManifestObject(
    `${S3_URL_PREFIX}/${MOCK_1_CARDIAC_FASTQ1_FILENAME}`
  ),
  createS3UrlManifestObject(
    `${S3_URL_PREFIX}/${MOCK_1_CARDIAC_FASTQ2_FILENAME}`
  ),
];

// Mock data 2 - Updating existing size/checksum
export const MOCK_2_CARDIAC_KEY_PREFIX = "Cardiac/2022-02-22/";
export const MOCK_2_CARDIAC_BAM_FILENAME = "A0000002.bam";
export const MOCK_2_CARDIAC_BAI_FILENAME = "A0000002.bam.bai";
export const MOCK_2_CARDIAC_MANIFEST_FILENAME = "manifest.txt";
export const MOCK_2_STUDY_ID = "A0000002";
export const MOCK_2_CARDIAC_S3_OBJECT_LIST = [
  createS3ObjectList(
    `${MOCK_2_CARDIAC_KEY_PREFIX}${MOCK_2_CARDIAC_BAM_FILENAME}`
  ),
  createS3ObjectList(
    `${MOCK_2_CARDIAC_KEY_PREFIX}${MOCK_2_CARDIAC_BAI_FILENAME}`
  ),
  createS3ObjectList(
    `${MOCK_2_CARDIAC_KEY_PREFIX}${MOCK_2_CARDIAC_MANIFEST_FILENAME}`
  ),
];

export const MOCK_2_CARDIAC_MANIFEST =
  `checksum\tfilename\tagha_study_id\n` +
  `UPDATED_CHECKSUM\t${MOCK_2_CARDIAC_BAM_FILENAME}\t${MOCK_2_STUDY_ID}\n` +
  `UPDATED_CHECKSUM\t${MOCK_2_CARDIAC_BAI_FILENAME}\t${MOCK_2_STUDY_ID}\n`;

export const MOCK_2_MANIFEST_OBJECT = [
  createManifestObject(MOCK_2_CARDIAC_BAM_FILENAME, MOCK_2_STUDY_ID),
  createManifestObject(MOCK_2_CARDIAC_BAI_FILENAME, MOCK_2_STUDY_ID),
];

export const MOCK_2_BAM_FILE_RECORD = {
  ...MOCK_FILE_RECORD_TEMPLATE,
  url: `s3://agha-gdr-store-2.0/${MOCK_2_CARDIAC_KEY_PREFIX}${MOCK_2_CARDIAC_BAM_FILENAME}`,
};
export const MOCK_2_BAI_FILE_RECORD = {
  ...MOCK_FILE_RECORD_TEMPLATE,
  url: `s3://agha-gdr-store-2.0/${MOCK_2_CARDIAC_KEY_PREFIX}${MOCK_2_CARDIAC_BAI_FILENAME}`,
};

export const MOCK_2_BAM_FILE_SET = [
  MOCK_2_BAM_FILE_RECORD,
  MOCK_2_BAI_FILE_RECORD,
];

// Mock data 3 - Giving warning to delete
export const MOCK_3_CARDIAC_KEY_PREFIX = "Cardiac/2022-02-23/";
export const MOCK_3_CARDIAC_BAM_FILENAME = "A0000003.bam";
export const MOCK_3_CARDIAC_BAI_FILENAME = "A0000003.bam.bai";
export const MOCK_3_CARDIAC_MANIFEST_FILENAME = "manifest.txt";
export const MOCK_3_STUDY_ID = "A0000003";
export const MOCK_3_CARDIAC_S3_OBJECT_LIST = [
  createS3ObjectList(
    `${MOCK_3_CARDIAC_KEY_PREFIX}${MOCK_3_CARDIAC_MANIFEST_FILENAME}`
  ),
];

export const MOCK_3_CARDIAC_MANIFEST = `checksum\tfilename\tagha_study_id\n`;

/**
 * FILE set mock data
 */

export const MOCK_FASTQ_FORWARD_FILE_RECORD = {
  ...MOCK_FILE_RECORD_TEMPLATE,
  url: `${S3_URL_PREFIX}/FILE_L001_R1.fastq.gz`,
};
export const MOCK_FASTQ_REVERSE_FILE_RECORD = {
  ...MOCK_FILE_RECORD_TEMPLATE,
  url: `${S3_URL_PREFIX}/FILE_L001_R2.fastq.gz`,
};

export const MOCK_FASTQ_PAIR_FILE_SET = [
  MOCK_FASTQ_FORWARD_FILE_RECORD,
  MOCK_FASTQ_REVERSE_FILE_RECORD,
];

export const MOCK_BAM_FILE_RECORD = {
  ...MOCK_FILE_RECORD_TEMPLATE,
  url: `${S3_URL_PREFIX}/A0000001.bam`,
};
export const MOCK_BAI_FILE_RECORD = {
  ...MOCK_FILE_RECORD_TEMPLATE,
  url: `${S3_URL_PREFIX}/A0000001.bam.bai`,
};

export const MOCK_BAM_FILE_SET = [MOCK_BAM_FILE_RECORD, MOCK_BAI_FILE_RECORD];

export const MOCK_VCF_FILE_RECORD = {
  ...MOCK_FILE_RECORD_TEMPLATE,
  url: `${S3_URL_PREFIX}/19W001062.individual.norm.vcf.gz`,
};
export const MOCK_TBI_FILE_RECORD = {
  ...MOCK_FILE_RECORD_TEMPLATE,
  url: `${S3_URL_PREFIX}/19W001062.individual.norm.vcf.gz.tbi`,
};

export const MOCK_VCF_FILE_SET = [MOCK_VCF_FILE_RECORD, MOCK_TBI_FILE_RECORD];

// S3 client
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
