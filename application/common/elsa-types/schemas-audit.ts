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

export namespace RouteValidation {
  export const AuditEventUserFilterSchema = Type.Union([
    Type.Literal("release"),
    Type.Literal("user"),
    Type.Literal("system"),
    Type.Literal("all"),
  ]);
  export type AuditEventUserFilterType = Static<
    typeof AuditEventUserFilterSchema
  >;

  // Todo: Potentially generate TypeBox schemas from the EdgeDb interface for fastify validation.
  //       E.g https://github.com/sinclairzx81/typebox/discussions/317
  export const AuditEventForQuerySchema = Type.Object({
    page: Type.Optional(Type.Number()),
    orderByProperty: Type.Optional(Type.String()),
    orderAscending: Type.Optional(Type.Boolean()),
    filter: Type.Optional(Type.Array(AuditEventUserFilterSchema)),
  });
  export type AuditEventForQueryType = Static<typeof AuditEventForQuerySchema>;

  export const AuditEventByIdQuerySchema = Type.Object({
    id: Type.String(),
  });
  export type AuditEventFullQueryType = Static<
    typeof AuditEventByIdQuerySchema
  >;

  export const AuditEventDetailsQuerySchema = Type.Object({
    ...AuditEventByIdQuerySchema.properties,
    start: Type.Optional(Type.Number()),
    end: Type.Optional(Type.Number()),
  });
  export type AuditEventDetailsQueryType = Static<
    typeof AuditEventDetailsQuerySchema
  >;
}
