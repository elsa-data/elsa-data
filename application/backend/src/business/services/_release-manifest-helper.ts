import e from "../../../dbschema/edgeql-js";
import { collapseExternalIds, getReleaseInfo } from "./helpers";
import { Executor } from "edgedb";
import { Static, Type } from "@sinclair/typebox";
import { createReleaseFileList } from "./_release-file-list-helper";
import { artifactFilesForSpecimensQuery } from "../db/artifact-queries";
import _ from "lodash";

export const ManifestExternalIdentifiersSchema = Type.Record(
  Type.String(),
  Type.Union([Type.String(), Type.Array(Type.String())])
);

export const ManifestSpecimenSchema = Type.Object({
  // the htsget key that points to the corresponding read/variants records declared in the manifest
  htsgetId: Type.String(),

  // external identifiers attached to this specimen for linkage
  ids: ManifestExternalIdentifiersSchema,
});

export const ManifestPatientSchema = Type.Object({
  // external identifiers attached to this patient for linkage
  ids: ManifestExternalIdentifiersSchema,

  specimens: Type.Array(ManifestSpecimenSchema),
});

export const ManifestCaseSchema = Type.Object({
  // external identifiers attached to this case for linkage
  ids: ManifestExternalIdentifiersSchema,

  patients: Type.Array(ManifestPatientSchema),
});

export const ManifestRegionRestrictionSchema = Type.Object({
  // TBD
  // need to think about what sort of restrictions we want here and how much burden to put on htsget
  // to calculate them
  // at the simplest - this would be an array of start/end regions
  // byGene: Type.Record(Type.String(), Type.Number())
});

export const ManifestReadsFileSchema = Type.Object({
  url: Type.String(),

  restriction: Type.Optional(Type.String()),
});

export const ManifestVariantsFileSchema = Type.Object({
  url: Type.String(),
  variantSampleId: Type.String(),

  restriction: Type.Optional(Type.String()),
});

export const ManifestSchema = Type.Object({
  // the release identifier from Elsa Data
  id: Type.String(),

  // a dictionary of reads keyed by the htsget {id}
  reads: Type.Record(Type.String(), ManifestReadsFileSchema),

  // a dictionary of variants keyed by the htsget {id}
  variants: Type.Record(Type.String(), ManifestVariantsFileSchema),

  // a dictionary of restriction types keyed by arbitrary name/id
  // TBD
  restrictions: Type.Record(Type.String(), ManifestRegionRestrictionSchema),

  cases: Type.Array(ManifestCaseSchema),
});

export type ManifestType = Static<typeof ManifestSchema>;
export type ManifestReadsFileType = Static<typeof ManifestReadsFileSchema>;
export type ManifestVariantsFileType = Static<
  typeof ManifestVariantsFileSchema
>;

/**
 * @param executor the client or transaction to execute this query in
 * @param releaseId the release whose selected entries should go into the manifest
 * @param includeReadData whether to include BAM/FASTQ etc
 * @param includeVariantData whether to include VCF etc
 */
export async function createReleaseManifest(
  executor: Executor,
  releaseId: string,
  includeReadData: boolean,
  includeVariantData: boolean
): Promise<ManifestType> {
  const { releaseSelectedSpecimensQuery, datasetUriToIdMap } =
    await getReleaseInfo(executor, releaseId);

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
  const filesResults = await artifactFilesForSpecimensQuery.run(executor, {
    specimenIds: releaseSelectedSpecimens.map((s) => s.id),
  });

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
    // when we expose via htsget - we are talking about access at the specimen level (i.e. one sample in the VCF)
    const htsgetId: string = uuidToHtsgetId(filesResult.id);

    for (const art of filesResult.artifacts) {
      if ("vcfFile" in art) {
        const url = art["vcfFile"]?.url;
        if (url) {
          variantDictionary[htsgetId] = { url: url, variantSampleId: "" };
        }
      }
      if ("bamFile" in art) {
        const url = art["bamFile"]?.url;
        if (url) {
          readDictionary[htsgetId] = { url: url };
        }
      }
    }
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

  const manifest: ManifestType = {
    id: releaseId,
    reads: includeReadData ? readDictionary : {},
    variants: includeVariantData ? variantDictionary : {},
    restrictions: {},
    cases: tree.map((c) => {
      return {
        ids: externalIdsToMap(c.externalIdentifiers),
        patients: c.patients.map((p) => {
          return {
            ids: externalIdsToMap(p.externalIdentifiers),
            specimens: p.specimens.map((s) => {
              return {
                htsgetId: uuidToHtsgetId(s.id),
                ids: externalIdsToMap(s.externalIdentifiers),
              };
            }),
          };
        }),
      };
    }),
  };

  console.log(JSON.stringify(manifest, null, 2));

  return manifest;
}
