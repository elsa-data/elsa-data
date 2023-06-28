import _ from "lodash";
import { ManifestMasterType } from "./manifest-master-types";
import { ReleaseActivatedNothingError } from "../../exceptions/release-activation";

const S3_PREFIX = "s3://";
const GS_PREFIX = "gs://";
const R2_PREFIX = "r2://";

/**
 * Converts the manifest data we got direct from the database into a filter
 * manifest with slight tidying of the data.
 *
 * NOTE: it is possible that some of this functionality could move into the
 * actual db query
 *
 * @param manifest the input manifest to be transformed
 */
export async function transformDbManifestToMasterManifest(
  manifest: ManifestMasterType
): Promise<ManifestMasterType> {
  // TODO prune/collapse externalIdentifiers if we had rules about how they need to be processed

  // tests artifact files for their cloud location against our sharing rules
  const matchLocation = (url?: string): boolean => {
    if (_.isString(url)) {
      if (url.startsWith(S3_PREFIX) && manifest.releaseIsAllowedS3Data)
        return true;
      if (url.startsWith(GS_PREFIX) && manifest.releaseIsAllowedGSData)
        return true;
      if (url.startsWith(R2_PREFIX) && manifest.releaseIsAllowedR2Data)
        return true;
    }
    return false;
  };

  // Check to see if cases/specimens exist to begin with before activating a release.
  if (manifest.caseTree.length === 0) {
    throw new ReleaseActivatedNothingError("No cases selected");
  }
  if (manifest.specimenList.length === 0) {
    throw new ReleaseActivatedNothingError(
      "No specimens for the selected cases"
    );
  }

  // Check that at least some data sources are enabled.
  if (
    !manifest.releaseIsAllowedS3Data &&
    !manifest.releaseIsAllowedGSData &&
    !manifest.releaseIsAllowedR2Data
  ) {
    throw new ReleaseActivatedNothingError("No data sources enabled");
  }

  // we need to prune the manifest of all files that we should not be giving out access to
  // (according to our includeReadData etc)

  // NOTE: we are currently working around an EdgeDb generate issue which insists that artifact
  // fields like bamFile are mandatory when clearly the query makes them optional

  // downstream we should always be checking these ("if (a.bamFile)") - so once the generator typing
  // is fixed this should all just easily resolve here

  for (const specimen of manifest.specimenList) {
    const allowedArtifacts = [];
    for (const a of specimen.artifacts) {
      let removeBcl = true,
        removeFastq = true,
        removeBam = true,
        removeCram = true,
        removeVcf = true;

      if (manifest.releaseIsAllowedReadData) {
        // need to determine which of the artifact types (bam/cram etc) we are - and then whether our
        // storage/cloud location matches our desired sharing rules

        // our default rule is that we WILL REMOVE - here we are looking for reasons why
        // we should keep the fields
        if (a.bclFile) {
          if (matchLocation(a.bclFile.url)) removeBcl = false;
        }

        if (a.forwardFile && a.reverseFile) {
          if (
            matchLocation(a.forwardFile.url) &&
            matchLocation(a.reverseFile.url)
          )
            removeFastq = false;
        }

        if (a.bamFile && a.baiFile) {
          if (matchLocation(a.bamFile.url) && matchLocation(a.baiFile.url))
            removeBam = false;
        }

        if (a.cramFile && a.craiFile) {
          if (matchLocation(a.cramFile.url) && matchLocation(a.craiFile.url))
            removeCram = false;
        }
      }

      if (manifest.releaseIsAllowedVariantData) {
        if (a.vcfFile && a.tbiFile) {
          if (matchLocation(a.vcfFile.url) && matchLocation(a.tbiFile.url))
            removeVcf = false;
        }
      }

      // once we've done all the above logic we will have some clear instructions that tell us how
      // to fix up the artifact record
      if (removeBcl) delete (a as any).bclFile;
      if (removeFastq) {
        delete (a as any).forwardFile;
        delete (a as any).reverseFile;
      }
      if (removeBam) {
        delete (a as any).bamFile;
        delete (a as any).baiFile;
      }
      if (removeCram) {
        delete (a as any).cramFile;
        delete (a as any).craiFile;
      }
      if (removeVcf) {
        delete (a as any).vcfFile;
        delete (a as any).tbiFile;
      }

      // if we allowed any file data through then this is an artifact record to keep in the manifest
      if (!removeBcl || !removeFastq || !removeBam || !removeCram || !removeVcf)
        allowedArtifacts.push(a);
    }

    // If read or variant data is allowed, then throw an error if every read or variant artifact is null. That is, there
    // should be at least some read or variant data artifacts if that type of data is allowed.
    if (
      manifest.releaseIsAllowedReadData &&
      allowedArtifacts.every(
        (a) =>
          !a.bclFile &&
          !a.forwardFile &&
          !a.reverseFile &&
          !a.bamFile &&
          !a.baiFile &&
          !a.cramFile &&
          !a.craiFile
      )
    ) {
      throw new ReleaseActivatedNothingError(
        "Read data is enabled but there are no read data artifacts"
      );
    }
    if (
      manifest.releaseIsAllowedVariantData &&
      allowedArtifacts.every((a) => !a.vcfFile && !a.tbiFile)
    ) {
      throw new ReleaseActivatedNothingError(
        "Variant data is enabled but there are no variant data artifacts"
      );
    }

    specimen.artifacts = allowedArtifacts;
  }

  return manifest;
}
