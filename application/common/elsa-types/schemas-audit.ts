import { Static, Type } from "@sinclair/typebox";
import { TypeDate } from "./typebox-helpers";

export const AuditEntrySchema = Type.Object({
  whoId: Type.String(),
  whoDisplay: Type.String(),
  actionCategory: Type.String(),
  actionDescription: Type.String(),
  recordedDateTime: TypeDate,
  updatedDateTime: TypeDate,
  when: TypeDate,
  duration: Type.Optional(Type.String()),
  outcome: Type.Integer(),
});

export type AuditEntryType = Static<typeof AuditEntrySchema>;
