import { Static } from "@sinclair/typebox";
import {
  DatasetGen3SyncRequestSchema,
  DatasetGen3SyncResponseSchema,
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

/**
 * We use typebox to provide us with JSON schema compatible definitions
 * AND Typescript compatible types.
 *
 * This then allows us to do JSON schema checking on API boundaries, whilst
 * using the Typescript types for clearer React/Api code.
 */

export * from "./schemas";
export * from "./schemas-application-coded";
export * from "./schemas-audit";
export * from "./schemas-coding";
export * from "./schemas-dataset";
export * from "./schemas-duo";
export * from "./schemas-releases";
export * from "./schemas-testing";

export type ReleaseApplicationCodedType = Static<
  typeof ReleaseApplicationCodedSchema
>;

export type DatasetGen3SyncRequestType = Static<
  typeof DatasetGen3SyncRequestSchema
>;
export type DatasetGen3SyncResponseType = Static<
  typeof DatasetGen3SyncResponseSchema
>;

export type ReleaseRemsSyncRequestType = Static<
  typeof ReleaseRemsSyncRequestSchema
>;
