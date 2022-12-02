import { Static, Type } from "@sinclair/typebox";
import { TypeDate } from "./typebox-helpers";

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
  updatedDateTime: TypeDate,
  isInConfig: Type.Boolean(),
  summaryCaseCount: Type.Number(),
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

export type DatasetLightType = Static<typeof DatasetSchemaLight>;
export type DatasetDeepType = Static<typeof DatasetSchemaDeep>;
