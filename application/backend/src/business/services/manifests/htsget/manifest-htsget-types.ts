import { Static, Type } from "@sinclair/typebox";
import { CloudStorageSchema } from "../../cloud-storage-service";

/**
 * A dictionary storing external identifiers, keyed by the "system" of the
 * identifier. e.g. see https://www.hl7.org/fhir/identifier-registry.html. We
 * have a special designated system value of "" which means "no system".
 */
export const ManifestExternalIdentifiersSchema = Type.Record(
  // the identifier system
  Type.String(),
  // note we handle the case here
  // a) the most normal case where each system has a single value
  // b) the edge case where a system can have multiple identifier values in it (most likely when system = "")
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

export type ManifestHtsgetType = Static<typeof ManifestSchema>;
export type ManifestHtsgetReadsFileType = Static<
  typeof ManifestReadsFileSchema
>;
export type ManifestHtsgetVariantsFileType = Static<
  typeof ManifestVariantsFileSchema
>;

/**
 * Htsget manifest route schema.
 */
export const ManifestHtsgetParamsSchema = Type.Object({
  releaseKey: Type.String(),
});
export type ManifestHtsgetParamsType = Static<
  typeof ManifestHtsgetParamsSchema
>;

/**
 * Htsget manifest route query string schema.
 */
export const ManifestHtsgetQuerySchema = Type.Object({
  // Indicate the type of storage to reply with.
  type: CloudStorageSchema,
});
export type ManifestHtsgetQueryType = Static<typeof ManifestHtsgetQuerySchema>;

/**
 * Htsget manifest route response schema.
 */
export const ManifestHtsgetResponseSchema = Type.Object({
  location: Type.Optional(
    Type.Object({
      bucket: Type.String(),
      key: Type.String(),
    })
  ),
  // True if the object was not updated and is cached and valid, false otherwise.
  cached: Type.Boolean(),
});
export type ManifestHtsgetResponseType = Static<
  typeof ManifestHtsgetResponseSchema
>;
