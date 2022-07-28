import { Static, Type } from "@sinclair/typebox";
import { TypeDate } from "./typebox-helpers";

export const AuditEntrySchema = Type.Object({
  whoDisplay: Type.String(),

  actionCategory: Type.String(),
  actionDescription: Type.String(),

  when: TypeDate,

  duration: Type.Optional(Type.String()),
});

export type AuditEntryType = Static<typeof AuditEntrySchema>;
