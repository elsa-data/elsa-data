import _ from "lodash";
import type {
  ManifestHtsgetReadsFileType,
  ManifestHtsgetType,
  ManifestHtsgetVariantsFileType,
} from "./manifest-htsget-types";
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

    const S3_PREFIX = "s3://";
    const GS_PREFIX = "gs://";
    const R2_PREFIX = "r2://";

    const S3_REGEX = new RegExp("^s3://([^/]+)/(.*?([^/]+))$");
    const GS_REGEX = new RegExp("^gs://([^/]+)/(.*?([^/]+))$");
    const R2_REGEX = new RegExp("^r2://([^/]+)/(.*?([^/]+))$");

    const convert = (url: string): ManifestBucketKeyObjectType | null => {
      if (_.isString(url)) {
        if (url.startsWith(S3_PREFIX)) {
          const m = url.match(S3_REGEX);
          if (m) return { service: "s3", bucket: m[1], key: m[2] };
        }
        if (url.startsWith(GS_PREFIX)) {
          const m = url.match(GS_REGEX);
          if (m) return { service: "gs", bucket: m[1], key: m[2] };
        }
        if (url.startsWith(R2_PREFIX)) {
          const m = url.match(R2_REGEX);
          if (m) return { service: "r2", bucket: m[1], key: m[2] };
        }
      }
      return null;
    };

    for (const art of filesResult.artifacts) {
      if ("vcfFile" in art) {
        const c = convert(art["vcfFile"]?.url);
        if (c) converted.push(c);
      }
      if ("bamFile" in art) {
        const c = convert(art["bamFile"]?.url);
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
