import { Static } from "@sinclair/typebox";
import {
  DatasetGen3SyncRequestSchema,
  DatasetGen3SyncResponseSchema,
  DatasetSchemaDeep,
  DatasetSchemaLight,
  ReleaseAwsS3PresignRequestSchema,
  ReleaseAwsS3PresignResponseSchema,
  ReleaseRemsSyncRequestSchema,
} from "./schemas";
import {
  DuoLimitationCodedSchema,
  DuoLimitationSchema,
  DuoModifierSchema,
} from "./schemas-duo";
import { TestingRequestSchema } from "./schemas-testing";
import {
  ReleaseApplicationCodedSchema,
  ReleaseCaseSchema,
  ReleaseNodeStatusSchema,
  ReleasePatientSchema,
  ReleaseDetailSchema,
  ReleaseSpecimenSchema,
  ReleaseSummarySchema,
} from "./schemas-releases";

export * from "./schemas";
export * from "./schemas-duo";
export * from "./schemas-coding";
export * from "./schemas-testing";

export type ReleaseSummaryType = Static<typeof ReleaseSummarySchema>;
export type ReleaseDetailType = Static<typeof ReleaseDetailSchema>;

export type DuoLimitationCodedType = Static<typeof DuoLimitationCodedSchema>;

// for completeness, we include a DUO data use limitation that allows freetext - but for practical
// computation we essentially never want these
export type DuoLimitationType = Static<typeof DuoLimitationSchema>;

export type DuoModifierType = Static<typeof DuoModifierSchema>;

export type ReleaseApplicationCodedType = Static<
  typeof ReleaseApplicationCodedSchema
>;

export type DatasetLightType = Static<typeof DatasetSchemaLight>;
export type DatasetDeepType = Static<typeof DatasetSchemaDeep>;

export type DatasetGen3SyncRequestType = Static<
  typeof DatasetGen3SyncRequestSchema
>;
export type DatasetGen3SyncResponseType = Static<
  typeof DatasetGen3SyncResponseSchema
>;

export type ReleaseRemsSyncRequestType = Static<
  typeof ReleaseRemsSyncRequestSchema
>;

export type TestingRequestType = Static<typeof TestingRequestSchema>;

export type ReleaseNodeStatusType = Static<typeof ReleaseNodeStatusSchema>;

export type ReleaseSpecimenType = Static<typeof ReleaseSpecimenSchema>;
export type ReleasePatientType = Static<typeof ReleasePatientSchema>;
export type ReleaseCaseType = Static<typeof ReleaseCaseSchema>;
