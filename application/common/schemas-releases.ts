import { TLiteral, TSchema, TUnion, Type } from "@sinclair/typebox";
import { CodingSchema } from "./schemas-coding";

/**
 * We use typebox to provide us with JSON schema compatible definitions
 * AND Typescript compatible types.
 *
 * This then allows us to do JSON schema checking on API boundaries, whilst
 * using the Typescript types for clearer React/Api code.
 */

export const ReleaseApplicationCodedTypeSchema = StringUnion([
  "HMB",
  "DS",
  "CC",
  "GRU",
  "POA",
]);

export const ReleaseApplicationCodedSchema = Type.Object({
  type: ReleaseApplicationCodedTypeSchema,

  diseases: Type.Array(CodingSchema),

  countriesInvolved: Type.Array(CodingSchema),
});

export const ReleaseRunningJobSchema = Type.Object({
  percentDone: Type.Number(),
  messages: Type.Array(Type.String()),
  requestedCancellation: Type.Boolean(),
});

export const ReleaseSummarySchema = Type.Object({
  id: Type.String(),

  applicationDacIdentifier: Type.String(),
  applicationDacTitle: Type.String(),

  // if a job is running then this is the percent it is complete
  isRunningJobPercentDone: Type.Optional(Type.Number()),

  // once we get @role link properties working we should enable this
  // roleInRelease: Type.String(),
});

export const ReleaseDetailSchema = Type.Object({
  id: Type.String(),

  datasetUris: Type.Array(Type.String()),

  applicationDacIdentifier: Type.Optional(Type.String()),
  applicationDacTitle: Type.Optional(Type.String()),
  applicationDacDetails: Type.Optional(Type.String()),

  applicationCoded: ReleaseApplicationCodedSchema,

  runningJob: Type.Optional(ReleaseRunningJobSchema),

  permissionEditSelections: Type.Optional(Type.Boolean()),
  permissionEditApplicationCoded: Type.Optional(Type.Boolean()),
  permissionAccessData: Type.Optional(Type.Boolean()),
});

type IntoStringUnion<T> = {
  [K in keyof T]: T[K] extends string ? TLiteral<T[K]> : never;
};

function StringUnion<T extends string[]>(
  values: [...T]
): TUnion<IntoStringUnion<T>> {
  return { enum: values } as any;
}

export const ReleaseNodeStatusSchema = StringUnion([
  "selected",
  "indeterminate",
  "unselected",
]);

export const ReleaseSpecimenSchema = Type.Object({
  id: Type.String(),
  externalId: Type.String(), // TODO: fix this
  // the node status of whether this specimen is released
  nodeStatus: ReleaseNodeStatusSchema,
});

export const ReleasePatientBirthSexSchema = StringUnion([
  "male",
  "female",
  "other",
]);

export const ReleasePatientSchema = Type.Object({
  id: Type.String(),
  externalId: Type.String(), // TODO: fix this
  sexAtBirth: Type.Optional(ReleasePatientBirthSexSchema),
  specimens: Type.Array(ReleaseSpecimenSchema),
  // the node status of whether this patient is released
  nodeStatus: ReleaseNodeStatusSchema,
});

export const ReleaseCaseSchema = Type.Object({
  id: Type.String(),
  externalId: Type.String(), // TODO: fix this
  patients: Type.Array(ReleasePatientSchema),
  // both of these identifiers are possibly useful - lets work out which is most useful
  fromDatasetUri: Type.String(),
  fromDatasetId: Type.String(),
  // the node status of whether this case is released
  nodeStatus: ReleaseNodeStatusSchema,
});
