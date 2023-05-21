import _ from "lodash";
import { ManifestMasterType } from "./manifest-master-types";
import {
  ManifestBucketKeyObjectType,
  ManifestBucketKeyType,
} from "./manifest-bucket-key-types";
import { collapseExternalIds } from "../helpers";

/**
 * Create a simple list of files in the manifest broken into 3 fields - service, bucket, key
 * (for those object like stores that fit this pattern)
 * e.g
 *
 * s3   my-bucket   foo/bar.bam
 */
export async function transformMasterManifestToBucketKeyManifest(
  masterManifest: ManifestMasterType
): Promise<ManifestBucketKeyType> {
  const converted: ManifestBucketKeyObjectType[] = [];

  for (const specimenWithArtifacts of masterManifest.specimenList) {
    // TODO regex don't support trailing slashes - and should be fixed if we introduce sharing 'folders'
    const OBJECT_URL_REGEX = new RegExp("^([^:]+):\\/\\/([^\\/]+)\\/(.+)$");

    const getMd5 = (checksums: any[]): string | undefined => {
      for (const c of checksums || []) {
        if (c.type === "MD5") return c.value;
      }
      return undefined;
    };

    const decomposeFileIntoParts = (
      url: string,
      size: number,
      checksums: {
        type: "MD5" | "AWS_ETAG" | "SHA_1" | "SHA_256";
        value: string;
      }[]
    ): Pick<
      ManifestBucketKeyObjectType,
      | "objectStoreProtocol"
      | "objectStoreBucket"
      | "objectStoreKey"
      | "objectSize"
      | "md5"
    > => {
      if (_.isString(url)) {
        const match = url.match(OBJECT_URL_REGEX);
        if (match) {
          if (!["s3", "gs", "r2"].includes(match[1]))
            throw new Error(
              `Encountered object URL ${url} with unknown protocol ${match[1]}`
            );

          return {
            objectStoreProtocol: match[1],
            objectStoreBucket: match[2],
            objectStoreKey: match[3],
            objectSize: size,
            md5: getMd5(checksums),
          };
        }
      }
      throw new Error(
        `Encountered object URL ${url} that could not be correctly processed for release`
      );
    };

    for (const artifact of specimenWithArtifacts.artifacts) {
      const createEntry = (
        file: typeof artifact.baiFile,
        objectType: string
      ) => {
        return {
          caseId: collapseExternalIds(
            specimenWithArtifacts.case_[0].externalIdentifiers
          ),
          patientId: collapseExternalIds(
            specimenWithArtifacts.patient[0].externalIdentifiers
          ),
          specimenId: collapseExternalIds(
            specimenWithArtifacts.externalIdentifiers
          ),
          artifactId: artifact.id,
          objectType: objectType,
          objectStoreUrl: file.url,
          ...decomposeFileIntoParts(file.url, file.size, file.checksums),
        };
      };

      if (artifact.bclFile)
        converted.push(createEntry(artifact.bclFile, "BCL"));
      if (artifact.bamFile)
        converted.push(createEntry(artifact.bamFile, "BAM"));
      if (artifact.baiFile)
        converted.push(createEntry(artifact.baiFile, "BAM"));
      if (artifact.craiFile)
        converted.push(createEntry(artifact.craiFile, "CRAM"));
      if (artifact.cramFile)
        converted.push(createEntry(artifact.cramFile, "CRAM"));
      if (artifact.forwardFile)
        converted.push(createEntry(artifact.forwardFile, "FASTQ"));
      if (artifact.reverseFile)
        converted.push(createEntry(artifact.reverseFile, "FASTQ"));
      if (artifact.vcfFile)
        converted.push(createEntry(artifact.vcfFile, "VCF"));
      if (artifact.tbiFile)
        converted.push(createEntry(artifact.tbiFile, "VCF"));
    }

    // TODO note that this logic exposes all versions of every artifact.. we might consider if instead
    //      we give the option here to 'prefer'.. i.e. give me the S3 for a particular BAM, and only give the
    //      R2 if otherwise there is no S3
  }

  return {
    id: masterManifest.releaseKey,
    objects: converted,
  };
}
