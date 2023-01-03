import { Static, Type } from "@sinclair/typebox";

export const AuditEventSchema = Type.Object({});
export type AuditEventType = Static<typeof AuditEventSchema>;
