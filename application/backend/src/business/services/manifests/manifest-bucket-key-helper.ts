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

    const getMd5 = (checksums: any[]): string => {
      for (const c of checksums || []) {
        if (c.type === "MD5") return c.value;
      }
      return "";
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
      let objectType;

      if (artifact.bamFile || artifact.baiFile) objectType = "BAM";
      if (artifact.bclFile) objectType = "BCL";
      if (artifact.cramFile || artifact.craiFile) objectType = "CRAM";
      if (artifact.forwardFile || artifact.reverseFile) objectType = "FASTQ";
      if (artifact.vcfFile || artifact.tbiFile) objectType = "VCF";

      if (!objectType)
        throw new Error(
          `Encountered artifact ${artifact.id} that was not of an object type we knew`
        );

      // only one of these will be filled in and we are only interested in that one
      const file =
        artifact.baiFile ??
        artifact.bamFile ??
        artifact.bclFile ??
        artifact.craiFile ??
        artifact.cramFile ??
        artifact.forwardFile ??
        artifact.reverseFile ??
        artifact.vcfFile ??
        artifact.tbiFile;

      if (file) {
        const c: ManifestBucketKeyObjectType = {
          caseId: collapseExternalIds(
            specimenWithArtifacts.case_?.externalIdentifiers
          ),
          patientId: collapseExternalIds(
            specimenWithArtifacts.patient?.externalIdentifiers
          ),
          specimenId: collapseExternalIds(
            specimenWithArtifacts.externalIdentifiers
          ),
          artifactId: artifact.id,
          objectType: objectType,
          objectStoreUrl: file.url,
          ...decomposeFileIntoParts(file.url, file.size, file.checksums),
        };
        converted.push(c);
      }
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
