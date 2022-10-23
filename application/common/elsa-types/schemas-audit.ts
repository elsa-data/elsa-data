import { Static, Type } from "@sinclair/typebox";
import { TypeDate } from "./typebox-helpers";

export const AuditEntrySchema = Type.Object({
  whoId: Type.String(),
  whoDisplayName: Type.String(),
  actionCategory: Type.String(),
  actionDescription: Type.String(),
  recordedDateTime: TypeDate,
  updatedDateTime: TypeDate,
  occurredDateTime: TypeDate,
  occurredDuration: Type.Optional(Type.String()),
  outcome: Type.Integer(),
  details: Type.Optional(Type.String()),
});

export type AuditEntryType = Static<typeof AuditEntrySchema>;
