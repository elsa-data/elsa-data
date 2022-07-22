import { TLiteral, TSchema, TString, TUnion, Type } from "@sinclair/typebox";
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

  // if this release is in the time period of sharing
  //isSharingEnabled: Type.Boolean(),

  // if a job is running then this is the percent it is complete
  isRunningJobPercentDone: Type.Optional(Type.Number()),

  // once we get @role link properties working we should enable this
  // roleInRelease: Type.String(),
});

export const DateKind = Symbol("DateKind");
export interface TDate extends TSchema {
  type: "string";
  $static: Date;
  kind: typeof DateKind;
}
export const TypeDate = Type.String({ format: "date-time" }) as TString | TDate;

export const ReleaseDetailSchema = Type.Object({
  id: Type.String(),

  datasetUris: Type.Array(Type.String()),

  applicationDacIdentifier: Type.Optional(Type.String()),
  applicationDacTitle: Type.Optional(Type.String()),
  applicationDacDetails: Type.Optional(Type.String()),

  // the number of cases visible to whoever makes this call - for data owners this will always
  // be *all* cases, for others it will only be those available to them
  visibleCasesCount: Type.Integer(),

  applicationCoded: ReleaseApplicationCodedSchema,

  // the start and end dates of enabling access
  // both must be specified in order that access is started
  accessStartDate: Type.Optional(TypeDate),
  accessEndDate: Type.Optional(TypeDate),

  // the logically interpretation of the access start/end and current time - from the perspective of the server
  // (i.e. this could be computed by the front end from start date and end date)
  accessEnabled: Type.Boolean(),

  runningJob: Type.Optional(ReleaseRunningJobSchema),

  permissionEditSelections: Type.Optional(Type.Boolean()),
  permissionEditApplicationCoded: Type.Optional(Type.Boolean()),
  permissionAccessData: Type.Optional(Type.Boolean()),

  // once we get @role link properties working we should enable this
  // roleInRelease: Type.String(),
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
  // whether there is specimen specific consent statements
  customConsent: Type.Boolean(),
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
  // whether there is patient specific consent statements
  customConsent: Type.Boolean(),
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
  // whether there is case specific consent statements
  customConsent: Type.Boolean(),
});
