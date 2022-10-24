import { Static, TLiteral, TSchema, TUnion, Type } from "@sinclair/typebox";
import { CodingSchema } from "./schemas-coding";
import { TypeDate } from "./typebox-helpers";

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

const AwsFileRecordKey = [
  "caseId",
  "patientId",
  "specimenId",
  "fileType",
  "size",
  "s3Url",
  "s3Bucket",
  "s3Key",
  "s3Signed",
  "md5",
] as const;

export const FileRecordHeader = Type.Array(
  Type.Union(AwsFileRecordKey.map((header: string) => Type.Literal(header)))
);

export const ReleaseAwsS3PresignRequestSchema = Type.Object({
  // id: Type.String(),
  presignHeader: FileRecordHeader,
});

export const ReleaseAwsS3PresignResponseSchema = Type.Object({
  id: Type.String(),
  files: Type.Array(Type.String()),
});

export type FileRecordHeaderType = typeof AwsFileRecordKey[number];
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

export const RemsApprovedApplicationSchema = Type.Object({
  remsId: Type.Integer(),
  whoDisplay: Type.Optional(Type.String()),
  whoEmail: Type.Optional(Type.String()),
  description: Type.String(),
  when: Type.String(),
});

export type RemsApprovedApplicationType = Static<
  typeof RemsApprovedApplicationSchema
>;
