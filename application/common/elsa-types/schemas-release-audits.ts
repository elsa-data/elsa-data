import { Static, Type } from "@sinclair/typebox";
import { TypeDate } from "./typebox-helpers";

export const ActionCategorySchema = Type.Union([
  Type.Literal("C"),
  Type.Literal("R"),
  Type.Literal("U"),
  Type.Literal("D"),
  Type.Literal("E"),
]);
export type ActionCategoryType = Static<typeof ActionCategorySchema>;

const AuditEntryBaseSchema = Type.Object({
  objectId: Type.String(),
  whoId: Type.String(),
  whoDisplayName: Type.String(),
  actionCategory: ActionCategorySchema,
  actionDescription: Type.String(),
  recordedDateTime: TypeDate,
  updatedDateTime: TypeDate,
  occurredDateTime: TypeDate,
  occurredDuration: Type.Optional(Type.String()),
  outcome: Type.Integer(),
});

export const AuditEntrySchema = Type.Object({
  ...AuditEntryBaseSchema.properties,
  hasDetails: Type.Boolean(),
});
export type AuditEntryType = Static<typeof AuditEntrySchema>;

export const AuditEntryDetailsSchema = Type.Object({
  objectId: Type.String(),
  details: Type.Optional(Type.String()),
  truncated: Type.Optional(Type.Boolean()),
});
export type AuditEntryDetailsType = Static<typeof AuditEntryDetailsSchema>;

export const AuditEntryFullSchema = Type.Object({
  ...AuditEntryBaseSchema.properties,
  details: Type.Optional(Type.Any()),
});
export type AuditEntryFullType = Static<typeof AuditEntryFullSchema>;

export const AuditDataAccessSchema = Type.Object({
  ...AuditEntryBaseSchema.properties,
  occurredDateTime: Type.String(),
  fileUrl: Type.String(),
  fileSize: Type.Integer(),
  egressBytes: Type.Integer(),
});
export type AuditDataAccessType = Static<typeof AuditDataAccessSchema>;

export const AuditDataSummarySchema = Type.Object({
  fileUrl: Type.String(),
  fileSize: Type.Integer(),
  dataAccessedInBytes: Type.Integer(),
  downloadStatus: Type.String(),
  lastAccessedTime: Type.String(),
  target: Type.String(),
});
export type AuditDataSummaryType = Static<typeof AuditDataSummarySchema>;
