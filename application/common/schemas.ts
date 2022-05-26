import { Type } from "@sinclair/typebox";

/**
 * We use typebox to provide us with JSON schema compatible definitions
 * AND Typescript compatible types.
 *
 * This then allows us to do JSON schema checking on API boundaries, whilst
 * using the Typescript types for clearer React/Api code.
 */

export const DatasetSpecimenSchema = Type.Object({});

export const DatasetPatientSchema = Type.Object({
  specimens: Type.Array(DatasetSpecimenSchema),
});

export const DatasetCaseSchema = Type.Object({
  patients: Type.Array(DatasetPatientSchema),
});

export const DatasetSchemaLight = Type.Object({
  id: Type.String(),
  identifier: Type.String(),
  description: Type.String(),
});

export const DatasetSchemaNesting = Type.Object({
  cases: Type.Array(DatasetCaseSchema),
});

export const DatasetSchemaDeep = Type.Union([
  DatasetSchemaLight,
  DatasetSchemaNesting,
]);

const ReleaseDatasetSchema = Type.Object({});

export const ReleaseSchema = Type.Object({
  id: Type.String(),
  datasets: Type.Array(ReleaseDatasetSchema),
});
