import e from "../../../../dbschema/edgeql-js";
import { getReleaseInfo } from "../helpers";
import { Executor } from "edgedb";
import { artifactFilesForSpecimensQuery } from "../../db/artifact-queries";
import _ from "lodash";
import type {
  ManifestReadsFileType,
  ManifestType,
  ManifestVariantsFileType,
} from "./manifest-types";

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
 * @param executor the client or transaction to execute this query in
 * @param releaseKey the release whose selected entries should go into the manifest
 * @param includeReadData whether to include BAM access to htsget
 * @param includeVariantData whether to include VCF access to htsget
 * @param includeS3Access
 * @param includeGSAccess
 * @param includeR2Access
 */
export async function createReleaseManifest(
  executor: Executor,
  releaseKey: string,
  includeReadData: boolean,
  includeVariantData: boolean,
  includeS3Access: boolean,
  includeGSAccess: boolean,
  includeR2Access: boolean
): Promise<ManifestType> {
  const { releaseSelectedSpecimensQuery } = await getReleaseInfo(
    executor,
    releaseKey
  );

  // get the tree of cases/patients/specimens - that we want to put into the manifest
  // (currently just shows the tree of data and key linkages - but could contain *actual*
  // data I guess (age etc)
  const tree = await e
    .select(e.dataset.DatasetCase, (c) => ({
      ...e.dataset.DatasetCase["*"],
      dataset: {
        id: true,
        uri: true,
      },
      patients: (p) => ({
        ...e.dataset.DatasetPatient["*"],
        // this filter is needed otherwise we end up with 'empty' patients
        filter: e.op(p.specimens, "in", releaseSelectedSpecimensQuery),
        specimens: (s) => ({
          ...e.dataset.DatasetSpecimen["*"],
          // this filter actually makes sure only the allowed specimens are released
          filter: e.op(s, "in", releaseSelectedSpecimensQuery),
        }),
      }),
      // this filter is needed otherwise we end up with 'empty' cases
      filter: e.op(c.patients.specimens, "in", releaseSelectedSpecimensQuery),
      // order is kind of irrelevant but we aim for it to at least be stable
      order_by: [
        {
          expression: c.dataset.uri,
          direction: e.ASC,
        },
        {
          expression: c.id,
          direction: e.ASC,
        },
      ],
    }))
    .run(executor);

  const releaseSelectedSpecimens = await releaseSelectedSpecimensQuery.run(
    executor
  );

  // a query to retrieve all the files associated with this release
  // this can contain results from multiple data locations (S3, GS etc)
  const filesResults = await artifactFilesForSpecimensQuery.run(executor, {
    specimenIds: releaseSelectedSpecimens.map((s) => s.id),
  });

  // a little tidy up of the uuids so they look not quite as uuids
  const uuidToHtsgetId = (uuid: string): string => {
    return uuid.replaceAll("-", "").toUpperCase();
  };

  // convert the raw files into a dictionary of variants/reads - keyed by a guaranteed unique htsget id
  // (happens to be the edgedb id reformatted but could be anything - it is restricted locally to this manifest)
  // (we have no guarantee that externalIdentifiers used for specimens are actually unique across any release hence
  //  us needing to use something else)
  // TODO could we test the externalIdentifiers for uniqueness as a first step - and if yes - use them as preference?
  const readDictionary: { [hid: string]: ManifestReadsFileType } = {};
  const variantDictionary: { [hid: string]: ManifestVariantsFileType } = {};

  for (const filesResult of filesResults) {
    // NOTE: we prefer the specimen id over the artifact id here - because of the VCF with multiple samples problem
    // it is entirely possible we might have 3 specimens say (a trio) all pointing to a single VCF artifact
    // when we expose via htsget - we are talking about access at the specimen level (i.e. one sample in the VCF is
    // exposed via htsget per request)
    const htsgetId: string = uuidToHtsgetId(filesResult.id);

    // at the moment - with only three practical file locations - we do this splitting/logic
    // will need to rethink approach I think if we add others
    let s3Variant: ManifestVariantsFileType | undefined;
    let gsVariant: ManifestVariantsFileType | undefined;
    let r2Variant: ManifestVariantsFileType | undefined;
    let s3Read: ManifestReadsFileType | undefined;
    let gsRead: ManifestReadsFileType | undefined;
    let r2Read: ManifestReadsFileType | undefined;

    const S3_PREFIX = "s3://";
    const GS_PREFIX = "gs://";
    const R2_PREFIX = "r2://";

    for (const art of filesResult.artifacts) {
      if ("vcfFile" in art) {
        const url = art["vcfFile"]?.url;
        if (_.isString(url)) {
          if (url.startsWith(S3_PREFIX))
            s3Variant = { url: url, variantSampleId: "" };
          if (url.startsWith(GS_PREFIX))
            gsVariant = { url: url, variantSampleId: "" };
          if (url.startsWith(R2_PREFIX))
            r2Variant = { url: url, variantSampleId: "" };
        }
      }
      if ("bamFile" in art) {
        const url = art["bamFile"]?.url;
        if (url) {
          if (url.startsWith(S3_PREFIX)) s3Read = { url: url };
          if (url.startsWith(GS_PREFIX)) gsRead = { url: url };
          if (url.startsWith(R2_PREFIX)) r2Read = { url: url };
        }
      }
    }

    // note the logic here prefers AWS over GS over R2 - where more than 1
    // are present as artifacts AND more than 1 are selected for inclusion
    // TODO think how we might handle this better
    if (includeS3Access && s3Variant) variantDictionary[htsgetId] = s3Variant;
    else if (includeGSAccess && gsVariant)
      variantDictionary[htsgetId] = gsVariant;
    else if (includeR2Access && r2Variant)
      variantDictionary[htsgetId] = r2Variant;

    if (includeS3Access && s3Read) readDictionary[htsgetId] = s3Read;
    else if (includeGSAccess && gsRead) readDictionary[htsgetId] = gsRead;
    else if (includeR2Access && r2Read) readDictionary[htsgetId] = r2Read;
  }

  const externalIdsToMap = (
    ids: { system: string; value: string }[] | null
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
    id: releaseKey,
    reads: includeReadData ? readDictionary : {},
    variants: includeVariantData ? variantDictionary : {},
    // TODO implement a restrictions mechanism both here and in the htsget server
    restrictions: {},
    cases: tree.map((c) => {
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
                const hid = uuidToHtsgetId(s.id);

                return hid in readDictionary || hid in variantDictionary;
              })
              .map((s) => ({
                htsgetId: uuidToHtsgetId(s.id),
                ids: externalIdsToMap(s.externalIdentifiers),
              })),
          };
        }),
      };
    }),
  };
}
