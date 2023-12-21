import _ from "lodash";
import type {
  ManifestHtsgetReadsFileType,
  ManifestHtsgetType,
  ManifestHtsgetVariantsFileType,
} from "./manifest-htsget-types";
import { ManifestRegionRestrictionType } from "./manifest-htsget-types";
import { ManifestMasterType } from "../manifest-master-types";

/**
 * Create a structured/tree manifest for the data included in a release.
 * The job of the manifest is to give the structure of the data and enough
 * ids/file paths to enable a user with the manifest to understand where the files
 * are and how they relate to each other.
 *
 * The primary use case *for this manifest* is to be something that can be shared
 * by htsget endpoints and the user - giving them details of which files are
 * available and on which identifiers.
 *
 *
 */
export async function transformMasterManifestToHtsgetManifest(
  masterManifest: ManifestMasterType,
): Promise<ManifestHtsgetType> {
  // a little tidy up of the uuids so they look not quite as uuids
  // const uuidToHtsgetId = (uuid: string): string => {
  //   return uuid.replaceAll("-", "").toUpperCase();
  // };

  // convert the raw files into a dictionary of variants/reads - keyed by a guaranteed unique htsget id
  // (happens to be the edgedb id reformatted but could be anything - it is restricted locally to this manifest)
  // (we have no guarantee that externalIdentifiers used for specimens are actually unique across any release hence
  //  us needing to use something else)
  // TODO could we test the externalIdentifiers for uniqueness as a first step - and if yes - use them as preference?
  const readDictionary: { [hid: string]: ManifestHtsgetReadsFileType } = {};
  const variantDictionary: { [hid: string]: ManifestHtsgetVariantsFileType } =
    {};

  // I don't really know if these numbers mean that much, but should be okay for a demo.
  // todo: proper way to share/assign particular genes to regions.
  const applyRestrictions = (update: ManifestRegionRestrictionType[]) => {
    if (
      masterManifest.releaseHtsgetRestrictions.includes("CongenitalHeartDefect")
    ) {
      update.push(
        ...[
          { chromosome: 9, start: 130713043, end: 130887675 },
          { chromosome: 15, start: 34790230, end: 34795549 },
          { chromosome: 2, start: 157736446, end: 157876330 },
        ],
      );
    }

    if (masterManifest.releaseHtsgetRestrictions.includes("Autism")) {
      update.push(
        ...[
          { chromosome: 20, start: 50888918, end: 50931437 },
          { chromosome: 22, start: 40346500, end: 40387527 },
          { chromosome: 1, start: 27534245, end: 27604227 },
        ],
      );
    }

    if (masterManifest.releaseHtsgetRestrictions.includes("Achromatopsia")) {
      update.push(
        ...[
          { chromosome: 1, start: 161766320, end: 161964070 },
          { chromosome: 2, start: 98346456, end: 98398601 },
          { chromosome: 8, start: 86574179, end: 86743634 },
        ],
      );
    }
  };

  for (const filesResult of masterManifest.specimenList) {
    // NOTE: we prefer the specimen id over the artifact id here - because of the VCF with multiple samples problem
    // it is entirely possible we might have 3 specimens say (a trio) all pointing to a single VCF artifact
    // when we expose via htsget - we are talking about access at the specimen level (i.e. one sample in the VCF is
    // exposed via htsget per request)
    const htsgetId: string = filesResult.id;

    // at the moment - with only three practical file locations - we do this splitting/logic
    // will need to rethink approach I think if we add others
    let s3Variant: ManifestHtsgetVariantsFileType | undefined;
    let gsVariant: ManifestHtsgetVariantsFileType | undefined;
    let r2Variant: ManifestHtsgetVariantsFileType | undefined;
    let s3Read: ManifestHtsgetReadsFileType | undefined;
    let gsRead: ManifestHtsgetReadsFileType | undefined;
    let r2Read: ManifestHtsgetReadsFileType | undefined;

    const S3_PREFIX = "s3://";
    const GS_PREFIX = "gs://";
    const R2_PREFIX = "r2://";

    for (const art of filesResult.artifacts) {
      // NOTE htsget protocol supports BAM, VCF, BCF and CRAM, although this is only BAMs and VCFS currently
      // (and the indexes are dealt with by htsget) hence us only interested in vcfFile and bamFile

      if ("vcfFile" in art) {
        const url = art["vcfFile"]?.url;
        if (_.isString(url)) {
          if (url.startsWith(S3_PREFIX))
            s3Variant = { url: url, variantSampleId: "", restrictions: [] };
          if (url.startsWith(GS_PREFIX))
            gsVariant = { url: url, variantSampleId: "", restrictions: [] };
          if (url.startsWith(R2_PREFIX))
            r2Variant = { url: url, variantSampleId: "", restrictions: [] };
        }
      }
      if ("bamFile" in art) {
        const url = art["bamFile"]?.url;
        if (url) {
          if (url.startsWith(S3_PREFIX))
            s3Read = { url: url, restrictions: [] };
          if (url.startsWith(GS_PREFIX))
            gsRead = { url: url, restrictions: [] };
          if (url.startsWith(R2_PREFIX))
            r2Read = { url: url, restrictions: [] };
        }
      }
    }

    // note the logic here prefers AWS over GS over R2 - where more than 1
    // are present as artifacts AND more than 1 are selected for inclusion
    // TODO think how we might handle this better
    if (s3Variant) {
      variantDictionary[htsgetId] = s3Variant;
      applyRestrictions(variantDictionary[htsgetId].restrictions);
    } else if (gsVariant) {
      variantDictionary[htsgetId] = gsVariant;
      applyRestrictions(variantDictionary[htsgetId].restrictions);
    } else if (r2Variant) {
      variantDictionary[htsgetId] = r2Variant;
      applyRestrictions(variantDictionary[htsgetId].restrictions);
    }

    if (s3Read) {
      readDictionary[htsgetId] = s3Read;
      applyRestrictions(readDictionary[htsgetId].restrictions);
    } else if (gsRead) {
      readDictionary[htsgetId] = gsRead;
      applyRestrictions(readDictionary[htsgetId].restrictions);
    } else if (r2Read) {
      readDictionary[htsgetId] = r2Read;
      applyRestrictions(readDictionary[htsgetId].restrictions);
    }
  }

  const externalIdsToMap = (
    ids: { system: string; value: string }[] | null,
  ): { [id: string]: string | string[] } => {
    const result: { [id: string]: string | string[] } = {};
    for (const id of ids || []) {
      // this *should* be true..
      if (_.isString(id.value) && _.isString(id.system)) {
        // NOTE: an empty system string is valid here and in fact is used regularly - however if the value
        // is empty them we don't bother
        if (id.value) {
          if (id.system in result) {
            const currentValue = result[id.system];
            // if current value is a single string - we convert to an array
            if (_.isString(currentValue)) result[id.system] = [currentValue];

            // by now we know that this either *way* as a string[] or has been converted to one
            (result[id.system] as string[]).push(id.value);
          } else result[id.system] = id.value;
        }
      }
    }
    return result;
  };

  return {
    id: masterManifest.releaseKey,
    reads: readDictionary,
    variants: variantDictionary,
    // TODO implement a restrictions mechanism both here and in the htsget server
    cases: masterManifest.caseTree.map((c) => {
      return {
        ids: externalIdsToMap(c.externalIdentifiers),
        patients: c.patients.map((p) => {
          return {
            ids: externalIdsToMap(p.externalIdentifiers),
            specimens: p.specimens
              // if we had no appropriate files for a particular specimen - then there is no point
              // in including it here as there is nothing to point htsget to
              // TODO is this the correct decision? - maybe the researcher wants to know no file avail?
              .filter((s) => {
                const hid = s.id;

                return hid in readDictionary || hid in variantDictionary;
              })
              .map((s) => ({
                htsgetId: s.id,
                ids: externalIdsToMap(s.externalIdentifiers),
              })),
          };
        }),
      };
    }),
  };
}
