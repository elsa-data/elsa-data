import { Type } from "@sinclair/typebox";
import { ApplicationCodedSchemaV1 } from "./schemas-application-coded";

/**
 * We use typebox to provide us with JSON schema compatible definitions
 * AND Typescript compatible types.
 *
 * This then allows us to do JSON schema checking on API boundaries, whilst
 * using the Typescript types for clearer React/Api code.
 */

export const ArtifactSchema = Type.Object({
  location: Type.String(),
  size: Type.Number(),
  type: Type.String(),
  md5: Type.Optional(Type.String()),
});

export const DatasetSpecimenSchema = Type.Object({
  artifacts: Type.Array(ArtifactSchema),
});

export const DatasetPatientSchema = Type.Object({
  specimens: Type.Array(DatasetSpecimenSchema),
});

export const DatasetCaseSchema = Type.Object({
  patients: Type.Array(DatasetPatientSchema),
});

export const DatasetSchemaLight = Type.Object({
  id: Type.String(),
  uri: Type.String(),
  description: Type.String(),
  summaryPatientCount: Type.Number(),
  summarySpecimenCount: Type.Number(),
  summaryArtifactCount: Type.Number(),
  summaryArtifactIncludes: Type.String(),
  summaryArtifactSizeBytes: Type.Number(),
});

export const DatasetSchemaNesting = Type.Object({
  cases: Type.Array(DatasetCaseSchema),
});

export const DatasetSchemaDeep = Type.Intersect([
  DatasetSchemaLight,
  DatasetSchemaNesting,
]);

export const ReleaseSchema = Type.Object({
  id: Type.String(),
  datasetUris: Type.Array(Type.String()),
  applicationCoded: ApplicationCodedSchemaV1,
  applicationDacIdentifier: Type.Optional(Type.String()),
  applicationDacTitle: Type.Optional(Type.String()),
  applicationDacDetails: Type.Optional(Type.String()),
});

export const DatasetGen3SyncRequestSchema = Type.Object({
  uri: Type.String({ maxLength: 10 }),
  gen3Url: Type.String(),
  gen3Bearer: Type.String(),
});

export const DatasetGen3SyncResponseSchema = Type.Object({
  error: Type.Optional(Type.String()),
});
