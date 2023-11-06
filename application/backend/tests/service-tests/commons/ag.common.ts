import { storage } from "../../../dbschema/interfaces";
import { MergedManifestMetadataType } from "../../../src/business/services/australian-genomics/s3-index-import-service";

/**
 * Will declare some mock test data here
 */
export const MOCK_DATASET_URI = "urn:fdc:umccr.org:2022:dataset/10g"; // SYNC with 10g URI in elsa settings
export const MOCK_STORAGE_PREFIX_URL = "s3://umccr-10g-data-dev/Cardiac";
export const S3_URL_PREFIX = "s3://umccr-10g-data-dev/Cardiac/2019-11-21";

export function createS3ObjectList(
  key = "S3_KEY",
  etag = "AWS_ETAG",
  size = 1,
) {
  return {
    s3Url: `s3://umccr-10g-data-dev/${key}`,
    eTag: etag,
    size: size,
  };
}

function createManifestObject(
  filename = "FILE_L001_R1.fastq.gz",
  agha_study_id = "A0000001",
  checksum = "RANDOMCHECKSUM",
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
  agha_study_id_array = ["A0000001"],
  checksum = "RANDOMCHECKSUM",
) {
  return {
    checksum: checksum,
    s3Url: s3Url,
    agha_study_id: agha_study_id,
    agha_study_id_array: agha_study_id_array,
  };
}

// Template File Record dataset
export const MOCK_FILE_RECORD_TEMPLATE = {
  url: "s3://bucket/some/random/filename",
  size: 10,
  checksums: [
    {
      type: "MD5" as storage.ChecksumType,
      value: "RANDOMCHECKSUM",
    },
  ],
};

export const MOCK_MERGED_MANIFEST_TEMPLATE = {
  s3Url: "s3://bucket/some/random/filename",
  agha_study_id_array: [],
  checksum: "md5md5md5",
  size: 10,
  eTag: "eTageTageTag",
};

// Mock data 1 - A pair of fastq pair
export const MOCK_1_CARDIAC_KEY_PREFIX = "Cardiac/2019-11-21/";
export const MOCK_1_CARDIAC_FASTQ1_FILENAME = "FILE_L001_R1.fastq.gz";
export const MOCK_1_CARDIAC_FASTQ2_FILENAME = "FILE_L001_R2.fastq.gz";
export const MOCK_1_CARDIAC_MANIFEST_FILENAME = "manifest.txt";
export const MOCK_1_STUDY_ID = "A0000001";
export const MOCK_1_CARDIAC_S3_OBJECT_LIST = [
  createS3ObjectList(
    `${MOCK_1_CARDIAC_KEY_PREFIX}${MOCK_1_CARDIAC_FASTQ1_FILENAME}`,
  ),
  createS3ObjectList(
    `${MOCK_1_CARDIAC_KEY_PREFIX}${MOCK_1_CARDIAC_FASTQ2_FILENAME}`,
  ),
  createS3ObjectList(
    `${MOCK_1_CARDIAC_KEY_PREFIX}${MOCK_1_CARDIAC_MANIFEST_FILENAME}`,
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
    `${S3_URL_PREFIX}/${MOCK_1_CARDIAC_FASTQ1_FILENAME}`,
  ),
  createS3UrlManifestObject(
    `${S3_URL_PREFIX}/${MOCK_1_CARDIAC_FASTQ2_FILENAME}`,
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
    `${MOCK_2_CARDIAC_KEY_PREFIX}${MOCK_2_CARDIAC_BAM_FILENAME}`,
  ),
  createS3ObjectList(
    `${MOCK_2_CARDIAC_KEY_PREFIX}${MOCK_2_CARDIAC_BAI_FILENAME}`,
  ),
  createS3ObjectList(
    `${MOCK_2_CARDIAC_KEY_PREFIX}${MOCK_2_CARDIAC_MANIFEST_FILENAME}`,
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
  url: `s3://umccr-10g-data-dev/${MOCK_2_CARDIAC_KEY_PREFIX}${MOCK_2_CARDIAC_BAM_FILENAME}`,
};
export const MOCK_2_BAI_FILE_RECORD = {
  ...MOCK_FILE_RECORD_TEMPLATE,
  url: `s3://umccr-10g-data-dev/${MOCK_2_CARDIAC_KEY_PREFIX}${MOCK_2_CARDIAC_BAI_FILENAME}`,
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
    `${MOCK_3_CARDIAC_KEY_PREFIX}${MOCK_3_CARDIAC_MANIFEST_FILENAME}`,
  ),
];

export const MOCK_3_CARDIAC_MANIFEST = `checksum\tfilename\tagha_study_id\n`;

// Mock 4 - Multi studyId (VCF trios)
export const MOCK_4_CARDIAC_KEY_PREFIX = "Cardiac/2019-11-21/";
export const MOCK_4_CARDIAC_VCF_FILENAME = "MOCK_4_FILE_VCF.trio.vcf";
export const MOCK_4_CARDIAC_VCF_TBI_FILENAME = "MOCK_4_FILE_VCF.trio.vcf.tbi";
export const MOCK_4_CARDIAC_MANIFEST_FILENAME = "manifest.txt";
export const MOCK_4_STUDY_ID = "A0000001,A0000002,A0000003";
export const MOCK_4_STUDY_ID_1 = "A0000001";
export const MOCK_4_STUDY_ID_2 = "A0000002";
export const MOCK_4_STUDY_ID_3 = "A0000003";
export const MOCK_4_CARDIAC_S3_OBJECT_LIST = [
  createS3ObjectList(
    `${MOCK_4_CARDIAC_KEY_PREFIX}${MOCK_4_CARDIAC_VCF_FILENAME}`,
  ),
  createS3ObjectList(
    `${MOCK_4_CARDIAC_KEY_PREFIX}${MOCK_4_CARDIAC_VCF_TBI_FILENAME}`,
  ),
  createS3ObjectList(
    `${MOCK_4_CARDIAC_KEY_PREFIX}${MOCK_4_CARDIAC_MANIFEST_FILENAME}`,
  ),
];
export const MOCK_4_CARDIAC_MANIFEST =
  `checksum\tfilename\tagha_study_id\n` +
  `RANDOMCHECKSUM\t${MOCK_4_CARDIAC_VCF_FILENAME}\t${MOCK_4_STUDY_ID}\n` +
  `RANDOMCHECKSUM\t${MOCK_4_CARDIAC_VCF_TBI_FILENAME}\t${MOCK_4_STUDY_ID}\n`;

/**
 * FILE set mock data
 */

export const MOCK_FASTQ_FORWARD_MERGE_MANIFEST: MergedManifestMetadataType = {
  ...MOCK_MERGED_MANIFEST_TEMPLATE,
  s3Url: `${S3_URL_PREFIX}/FILE_L001_R1.fastq.gz`,
};
export const MOCK_FASTQ_REVERSE_MERGE_MANIFEST: MergedManifestMetadataType = {
  ...MOCK_MERGED_MANIFEST_TEMPLATE,
  s3Url: `${S3_URL_PREFIX}/FILE_L001_R2.fastq.gz`,
};

export const MOCK_BAM_MERGE_MANIFEST: MergedManifestMetadataType = {
  ...MOCK_MERGED_MANIFEST_TEMPLATE,
  s3Url: `${S3_URL_PREFIX}/A0000001.bam`,
};
export const MOCK_BAI_MERGE_MANIFEST: MergedManifestMetadataType = {
  ...MOCK_MERGED_MANIFEST_TEMPLATE,
  s3Url: `${S3_URL_PREFIX}/A0000001.bam.bai`,
};

export const MOCK_VCF_MERGE_MANIFEST: MergedManifestMetadataType = {
  ...MOCK_MERGED_MANIFEST_TEMPLATE,
  s3Url: `${S3_URL_PREFIX}/19W001062.individual.norm.vcf.gz`,
};
export const MOCK_TBI_MERGE_MANIFEST: MergedManifestMetadataType = {
  ...MOCK_MERGED_MANIFEST_TEMPLATE,
  s3Url: `${S3_URL_PREFIX}/19W001062.individual.norm.vcf.gz.tbi`,
};

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
