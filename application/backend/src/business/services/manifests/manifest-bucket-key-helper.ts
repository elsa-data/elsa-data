import _ from "lodash";
import { ManifestMasterType } from "./manifest-master-types";
import {
  ManifestBucketKeyObjectType,
  ManifestBucketKeyType,
} from "./manifest-bucket-key-types";

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

  for (const filesResult of masterManifest.specimenList) {
    // consider moving all these into *UrlService classes..

    // TODO these regexes don't support trailing slashes - and should be fixed if we introduce sharing 'folders'
    const S3_REGEX = new RegExp("^s3://([^/]+)/(.*?([^/]+))$");
    const GS_REGEX = new RegExp("^gs://([^/]+)/(.*?([^/]+))$");
    const R2_REGEX = new RegExp("^r2://([^/]+)/(.*?([^/]+))$");

    const convert = (
      artifactId: string,
      url: string,
      size: number
    ): ManifestBucketKeyObjectType | null => {
      if (_.isString(url)) {
        const s3Match = url.match(S3_REGEX);
        if (s3Match)
          return {
            artifactId: artifactId,
            service: "s3",
            bucket: s3Match[1],
            key: s3Match[2],
          };
        const gsMatch = url.match(GS_REGEX);
        if (gsMatch)
          return {
            artifactId: artifactId,
            service: "gs",
            bucket: gsMatch[1],
            key: gsMatch[2],
          };
        const r2Match = url.match(R2_REGEX);
        if (r2Match)
          return {
            artifactId: artifactId,
            service: "r2",
            bucket: r2Match[1],
            key: r2Match[2],
          };
      }
      return null;
    };

    for (const art of filesResult.artifacts) {
      // only one of these will be filled in and we are only interested in that one
      const file =
        art.baiFile ??
        art.bamFile ??
        art.bclFile ??
        art.craiFile ??
        art.cramFile ??
        art.forwardFile ??
        art.reverseFile ??
        art.vcfFile ??
        art.tbiFile;

      if (file) {
        const c = convert(art.id, file.url, file.size);
        if (c) converted.push(c);
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
