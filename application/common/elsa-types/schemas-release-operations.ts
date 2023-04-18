import { Static, Type } from "@sinclair/typebox";
import { CodingSchema } from "./schemas-coding";
import { StringUnion } from "./typebox-helpers";

// “add”, “remove”, “replace”, “move”, “copy” and “test”.

/**
 * The following schema defines all the PATCH operations that can be applied
 * to a Release. Given our releases are _enormous_ nested data structures in our backend, this was the
 * neatest way to allow the UI to make precise changes without submitting the entire
 * data structure back. It also allows us to have operations customised to the UI - i.e.
 * add/remove where our UI allows add/remove operations.
 */
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
    path: Type.Literal("/dataSharingConfiguration/objectSigningEnabled"),
    value: Type.Boolean(),
  }),
  Type.Object({
    op: Type.Literal("replace"),
    path: Type.Literal("/dataSharingConfiguration/objectSigningExpiryHours"),
    value: Type.Integer(),
  }),
  Type.Object({
    op: Type.Literal("replace"),
    path: Type.Literal("/dataSharingConfiguration/copyOutEnabled"),
    value: Type.Boolean(),
  }),
  Type.Object({
    op: Type.Literal("replace"),
    path: Type.Literal("/dataSharingConfiguration/copyOutDestinationLocation"),
    value: Type.String(),
  }),
  Type.Object({
    op: Type.Literal("replace"),
    path: Type.Literal("/dataSharingConfiguration/htsgetEnabled"),
    value: Type.Boolean(),
  }),
  Type.Object({
    op: Type.Literal("replace"),
    path: Type.Literal("/dataSharingConfiguration/awsAccessPointEnabled"),
    value: Type.Boolean(),
  }),
  Type.Object({
    op: Type.Literal("replace"),
    path: Type.Literal("/dataSharingConfiguration/awsAccessPointVpcId"),
    value: Type.String(),
  }),
  Type.Object({
    op: Type.Literal("replace"),
    path: Type.Literal("/dataSharingConfiguration/awsAccessPointAccountId"),
    value: Type.String(),
  }),
  Type.Object({
    op: Type.Literal("replace"),
    path: Type.Literal("/dataSharingConfiguration/gcpStorageIamEnabled"),
    value: Type.Boolean(),
  }),
  Type.Object({
    op: Type.Literal("replace"),
    path: Type.Literal("/dataSharingConfiguration/gcpStorageIamUsers"),
    value: Type.Array(Type.String()),
  }),
]);

export type ReleasePatchOperationType = Static<
  typeof ReleasePatchOperationSchema
>;

export const ReleasePatchOperationsSchema = Type.Array(
  ReleasePatchOperationSchema
);

export type ReleasePatchOperationsType = Static<
  typeof ReleasePatchOperationsSchema
>;
