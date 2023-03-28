import { Static, Type } from "@sinclair/typebox";

export const ManifestBucketKeyObjectSchema = Type.Object({
  caseId: Type.String(),
  patientId: Type.String(),
  specimenId: Type.String(),
  artifactId: Type.String(),

  objectType: Type.String(),
  objectSize: Type.Number(),

  objectStoreProtocol: Type.String(),
  objectStoreUrl: Type.String(),
  objectStoreBucket: Type.String(),
  objectStoreKey: Type.String(),

  // optional fields depending on what type of access asked for
  objectStoreSigned: Type.Optional(Type.String()),

  // optional depending on what checksums have been entered
  md5: Type.Optional(Type.String()),
});

export const ManifestBucketKeySchema = Type.Object({
  // the release identifier from Elsa Data
  id: Type.String(),

  // a list of all the objects
  objects: Type.Array(ManifestBucketKeyObjectSchema),
});

export type ManifestBucketKeyType = Static<typeof ManifestBucketKeySchema>;

export type ManifestBucketKeyObjectType = Static<
  typeof ManifestBucketKeyObjectSchema
>;
