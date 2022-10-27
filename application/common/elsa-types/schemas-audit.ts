import { Static, Type } from "@sinclair/typebox";
import { TypeDate } from "./typebox-helpers";

export const AuditEntrySchema = Type.Object({
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
  hasDetails: Type.Boolean(),
});

export type AuditEntryType = Static<typeof AuditEntrySchema>;

export const AuditEntryDetailsSchema = Type.Object({
  objectId: Type.String(),
  details: Type.Optional(Type.String()),
});

export type AuditEntryDetailsType = Static<typeof AuditEntryDetailsSchema>;
