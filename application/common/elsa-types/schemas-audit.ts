import { Static, Type } from "@sinclair/typebox";
import { TypeDate } from "./typebox-helpers";

const AuditEntryBaseSchema = Type.Object({
  objectId: Type.String(),
  whoId: Type.String(),
  whoDisplayName: Type.String(),
  actionCategory: Type.String(),
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
