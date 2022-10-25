import { Static, Type } from "@sinclair/typebox";
import { TypeDate } from "./typebox-helpers";

export const AuditEntrySchema = Type.Object({
  whoId: Type.Optional(Type.String()),
  whoDisplayName: Type.Optional(Type.String()),
  actionCategory: Type.Optional(Type.String()),
  actionDescription: Type.Optional(Type.String()),
  recordedDateTime: Type.Optional(TypeDate),
  updatedDateTime: Type.Optional(TypeDate),
  occurredDateTime: Type.Optional(TypeDate),
  occurredDuration: Type.Optional(Type.String()),
  outcome: Type.Optional(Type.Integer()),
  details: Type.Optional(Type.String()),
});

export type AuditEntryType = Static<typeof AuditEntrySchema>;
