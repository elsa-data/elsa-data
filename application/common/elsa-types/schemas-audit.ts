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

const AuditEventBaseSchema = Type.Object({
  objectId: Type.String(),
  whoId: Type.Optional(Type.Union([Type.Null(), Type.String()])),
  whoDisplayName: Type.Optional(Type.Union([Type.Null(), Type.String()])),
  actionCategory: ActionCategorySchema,
  actionDescription: Type.String(),
  recordedDateTime: TypeDate,
  updatedDateTime: TypeDate,
  occurredDateTime: TypeDate,
  occurredDuration: Type.Optional(Type.String()),
  outcome: Type.Integer(),
});

export const AuditEventSchema = Type.Object({
  ...AuditEventBaseSchema.properties,
  hasDetails: Type.Boolean(),
});
export type AuditEventType = Static<typeof AuditEventSchema>;

export const AuditEventDetailsSchema = Type.Object({
  objectId: Type.String(),
  details: Type.Optional(Type.String()),
  truncated: Type.Optional(Type.Boolean()),
});
export type AuditEventDetailsType = Static<typeof AuditEventDetailsSchema>;

export const AuditEventFullSchema = Type.Object({
  ...AuditEventBaseSchema.properties,
  details: Type.Optional(Type.Any()),
});
export type AuditEventFullType = Static<typeof AuditEventFullSchema>;

export const AuditDataAccessSchema = Type.Object({
  ...AuditEventBaseSchema.properties,
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
