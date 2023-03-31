import { Static, Type } from "@sinclair/typebox";
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

const ObjectStoreRecordKey = [
  "caseId",
  "patientId",
  "specimenId",
  "objectType",
  "objectSize",
  "objectStoreUrl",
  "objectStoreBucket",
  "objectStoreKey",
  "objectStoreSigned",
  "md5",
] as const;

export const FileRecordHeader = Type.Array(
  Type.Union(ObjectStoreRecordKey.map((header: string) => Type.Literal(header)))
);

export const ReleasePresignRequestSchema = Type.Object({
  // id: Type.String(),
  presignHeader: FileRecordHeader,
});

export const ReleasePresignResponseSchema = Type.Object({
  id: Type.String(),
  files: Type.Array(Type.String()),
});

export type FileRecordHeaderType = typeof ObjectStoreRecordKey[number];
export type ReleasePresignRequestType = Static<
  typeof ReleasePresignRequestSchema
>;
export type ReleasePresignResponseType = Static<
  typeof ReleasePresignResponseSchema
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
