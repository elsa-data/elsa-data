import { Static, TLiteral, TSchema, TUnion, Type } from "@sinclair/typebox";
import { CodingSchema } from "./schemas-coding";
import { TypeDate } from "./schemas-releases";

/**
 * We use typebox to provide us with JSON schema compatible definitions
 * AND Typescript compatible types.
 *
 * This then allows us to do JSON schema checking on API boundaries, whilst
 * using the Typescript types for clearer React/Api code.
 */

export const DatasetGen3SyncRequestSchema = Type.Object({
  uri: Type.String({ maxLength: 10 }),
  gen3Url: Type.String(),
  gen3Bearer: Type.String(),
});

export const DatasetGen3SyncResponseSchema = Type.Object({
  error: Type.Optional(Type.String()),
});

export const ReleaseRemsSyncRequestSchema = Type.Object({
  remsUrl: Type.String(),
  remsUser: Type.String(),
  remsKey: Type.String(),
});

export const ReleaseAwsS3PresignRequestSchema = Type.Object({
  // id: Type.String(),
});

export const ReleaseAwsS3PresignResponseSchema = Type.Object({
  id: Type.String(),
  files: Type.Array(Type.String()),
});

export type ReleaseAwsS3PresignRequestType = Static<
  typeof ReleaseAwsS3PresignRequestSchema
>;
export type ReleaseAwsS3PresignResponseType = Static<
  typeof ReleaseAwsS3PresignResponseSchema
>;

export const ReleaseMasterAccessRequestSchema = Type.Object({
  start: Type.Optional(TypeDate),
  end: Type.Optional(TypeDate),
});

export type ReleaseMasterAccessRequestType = Static<
  typeof ReleaseMasterAccessRequestSchema
>;
