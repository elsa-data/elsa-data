import { isString } from "lodash";
import { ManifestMasterType } from "./manifest-master-types";
import {
  KnownObjectProtocolsArray,
  KnownObjectProtocolType,
  ManifestBucketKeyObjectType,
  ManifestBucketKeyType,
} from "./manifest-bucket-key-types";
import { collapseExternalIds } from "../helpers";

/**
 * Create a simple list of object in the manifest broken into simple fields - service, bucket, key, protocol etc
 * (for those object like stores that fit this pattern)
 * e.g
 * s3   my-bucket   foo/bar.bam
 *
 * Note any filtering here is meant for "post-release" filtering - that is the master manifest representing
 * the data release might be authorised into GCS *and* S3 objects - but for a
 * specific use case we might just want the S3 ones
 * (in particular, our AWS access point sharing cannot work with a GCS object).
 * In general, the wildcard filter will be used to return *all* objects in the master manifest.
 *
 * @param masterManifest the master manifest
 * @param filterByProtocol a list of protocol (s3, gs, r2) to allow in the output, or an array containing "*" to mean all protocols
 */
export async function transformMasterManifestToBucketKeyManifest(
  masterManifest: ManifestMasterType,
  filterByProtocol: (KnownObjectProtocolType | "*")[],
): Promise<ManifestBucketKeyType> {
  // this might be overly strict - but until there is a use case for us generating empty manifests
  // I would prefer this is a hard fail early
  if (!filterByProtocol || filterByProtocol.length === 0) {
    throw new Error(
      "The protocol filter for the manifest transform is empty which guarantees an empty output",
    );
  }

  const converted: ManifestBucketKeyObjectType[] = [];

  for (const specimenWithArtifacts of masterManifest.specimenList) {
    // TODO this regex don't support trailing slashes - and should be fixed if we introduce sharing 'folders'
    const OBJECT_URL_REGEX = new RegExp("^([^:]+):\\/\\/([^\\/]+)\\/(.+)$");

    const getMd5 = (checksums: any[]): string | undefined => {
      for (const c of checksums || []) {
        if (c.type === "MD5") return c.value;
      }
      return undefined;
    };

    const decomposeObjectUrlIntoParts = (
      url: string,
      size: number,
      checksums: {
        type: "MD5" | "AWS_ETAG" | "SHA_1" | "SHA_256";
        value: string;
      }[],
    ): Pick<
      ManifestBucketKeyObjectType,
      | "objectStoreProtocol"
      | "objectStoreBucket"
      | "objectStoreKey"
      | "objectSize"
      | "md5"
    > => {
      if (isString(url)) {
        const match = url.match(OBJECT_URL_REGEX);
        if (match) {
          if (
            !KnownObjectProtocolsArray.includes(
              match[1] as KnownObjectProtocolType,
            )
          )
            throw new Error(
              `Encountered object URL ${url} with unknown protocol ${match[1]} - known protocols are ${KnownObjectProtocolsArray}`,
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
        `Encountered object URL ${url} that could not be correctly processed for release`,
      );
    };

    for (const artifact of specimenWithArtifacts.artifacts) {
      const createEntry = (
        file: typeof artifact.baiFile,
        objectType: string,
      ) => {
        return {
          caseId: collapseExternalIds(
            specimenWithArtifacts.case_?.externalIdentifiers,
          ),
          patientId: collapseExternalIds(
            specimenWithArtifacts.patient?.externalIdentifiers,
          ),
          specimenId: collapseExternalIds(
            specimenWithArtifacts.externalIdentifiers,
          ),
          artifactId: artifact.id,
          objectType: objectType,
          objectStoreUrl: file.url,
          ...decomposeObjectUrlIntoParts(file.url, file.size, file.checksums),
        };
      };

      // add the entry to the result but only if it matches our filters
      const convertedAddWithFilter = (e: ManifestBucketKeyObjectType) => {
        // if wildcard then always push
        if (filterByProtocol.length === 1 && filterByProtocol[0] === "*") {
          converted.push(e);
        } else {
          if (
            filterByProtocol.includes(
              e.objectStoreProtocol as KnownObjectProtocolType | "*",
            )
          )
            converted.push(e);
        }
      };

      if (artifact.bclFile)
        convertedAddWithFilter(createEntry(artifact.bclFile, "BCL"));
      if (artifact.bamFile)
        convertedAddWithFilter(createEntry(artifact.bamFile, "BAM"));
      if (artifact.baiFile)
        convertedAddWithFilter(createEntry(artifact.baiFile, "BAM"));
      if (artifact.craiFile)
        convertedAddWithFilter(createEntry(artifact.craiFile, "CRAM"));
      if (artifact.cramFile)
        convertedAddWithFilter(createEntry(artifact.cramFile, "CRAM"));
      if (artifact.forwardFile)
        convertedAddWithFilter(createEntry(artifact.forwardFile, "FASTQ"));
      if (artifact.reverseFile)
        convertedAddWithFilter(createEntry(artifact.reverseFile, "FASTQ"));
      if (artifact.vcfFile)
        convertedAddWithFilter(createEntry(artifact.vcfFile, "VCF"));
      if (artifact.tbiFile)
        convertedAddWithFilter(createEntry(artifact.tbiFile, "VCF"));
    }

    // TODO note that this logic exposes all versions of every artifact.. we might consider if instead
    //      we give the option here to 'prefer'.. i.e. give me the S3 for a particular BAM, and only give the
    //      R2 if otherwise there is no S3
    // addendum - we have added some basic filtering - but still not as big a mechanism as I could imagine
    // (which might involve complex preference algorithm)
  }

  return {
    id: masterManifest.releaseKey,
    objects: converted,
  };
}
