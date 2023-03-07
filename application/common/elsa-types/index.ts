import { Static } from "@sinclair/typebox";
import {
  DatasetGen3SyncRequestSchema,
  DatasetGen3SyncResponseSchema,
  ReleaseRemsSyncRequestSchema,
} from "./schemas";
import { ReleaseApplicationCodedSchema } from "./schemas-releases";

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
export * from "./schemas-release-operations";
export * from "./schemas-testing";
export * from "./error-types";

export * from "./csv-australian-genomics";

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
