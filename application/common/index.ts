import { Static } from "@sinclair/typebox";
import {
  DatasetGen3SyncRequestSchema,
  DatasetGen3SyncResponseSchema,
  DatasetSchemaDeep,
  DatasetSchemaLight,
  ReleaseSchema,
} from "./schemas";
import {
  DuoLimitationCodedSchema,
  DuoLimitationSchema,
  DuoModifierSchema,
} from "./schemas-duo";
import {
  ApplicationCodedSchemaV1,
  CodingSchema,
} from "./schemas-application-coded";

export * from "./schemas";
export * from "./schemas-duo";

export type ReleaseType = Static<typeof ReleaseSchema>;

export type DuoLimitationCodedType = Static<typeof DuoLimitationCodedSchema>;

// for completeness, we include a DUO data use limitation that allows freetext - but for practical
// computation we essentially never want these
export type DuoLimitationType = Static<typeof DuoLimitationSchema>;

export type DuoModifierType = Static<typeof DuoModifierSchema>;

export type ApplicationCodedTypeV1 = Static<typeof ApplicationCodedSchemaV1>;

export type CodingType = Static<typeof CodingSchema>;

export type DatasetLightType = Static<typeof DatasetSchemaLight>;
export type DatasetDeepType = Static<typeof DatasetSchemaDeep>;

export type DatasetGen3SyncRequestType = Static<
  typeof DatasetGen3SyncRequestSchema
>;
export type DatasetGen3SyncResponseType = Static<
  typeof DatasetGen3SyncResponseSchema
>;
