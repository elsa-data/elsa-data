import { Static, Type } from "@sinclair/typebox";
import { CodingSchema } from "./schemas-coding";
import { StringUnion } from "./typebox-helpers";

// “add”, “remove”, “replace”, “move”, “copy” and “test”.

export const ReleasePatchOperationSchema = Type.Union([
  Type.Object({
    op: Type.Literal("add"),
    path: Type.Literal("/specimens"),
    value: Type.Array(Type.String()),
  }),
  Type.Object({
    op: Type.Literal("remove"),
    path: Type.Literal("/specimens"),
    value: Type.Array(Type.String()),
  }),
  Type.Object({
    op: Type.Literal("add"),
    path: Type.Literal("/applicationCoded/diseases"),
    value: CodingSchema,
  }),
  Type.Object({
    op: Type.Literal("remove"),
    path: Type.Literal("/applicationCoded/diseases"),
    value: CodingSchema,
  }),
  Type.Object({
    op: Type.Literal("add"),
    path: Type.Literal("/applicationCoded/countries"),
    value: CodingSchema,
  }),
  Type.Object({
    op: Type.Literal("remove"),
    path: Type.Literal("/applicationCoded/countries"),
    value: CodingSchema,
  }),
  Type.Object({
    op: Type.Literal("replace"),
    path: Type.Literal("/applicationCoded/type"),
    value: StringUnion(["HMB", "DS", "CC", "GRU", "POA", "UN"]),
  }),
  Type.Object({
    op: Type.Literal("replace"),
    path: Type.Literal("/applicationCoded/beacon"),
    value: Type.Any(),
  }),
  Type.Object({
    op: Type.Literal("replace"),
    path: Type.Literal("/allowedRead"),
    value: Type.Boolean(),
  }),
  Type.Object({
    op: Type.Literal("replace"),
    path: Type.Literal("/allowedVariant"),
    value: Type.Boolean(),
  }),
  Type.Object({
    op: Type.Literal("replace"),
    path: Type.Literal("/allowedPhenotype"),
    value: Type.Boolean(),
  }),
  Type.Object({
    op: Type.Literal("replace"),
    path: Type.Literal("/allowedS3"),
    value: Type.Boolean(),
  }),
  Type.Object({
    op: Type.Literal("replace"),
    path: Type.Literal("/allowedGS"),
    value: Type.Boolean(),
  }),
  Type.Object({
    op: Type.Literal("replace"),
    path: Type.Literal("/allowedR2"),
    value: Type.Boolean(),
  }),
  Type.Object({
    op: Type.Literal("replace"),
    path: Type.Literal("/allowedHtsget"),
    value: Type.Boolean(),
  }),
]);

export const ReleasePatchOperationsSchema = Type.Array(
  ReleasePatchOperationSchema
);

export type ReleasePatchOperationsType = Static<
  typeof ReleasePatchOperationsSchema
>;

export type ReleasePatchOperationType = Static<
  typeof ReleasePatchOperationSchema
>;
