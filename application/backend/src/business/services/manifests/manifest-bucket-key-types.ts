import { Static, Type } from "@sinclair/typebox";

export const ManifestBucketKeyObjectSchema = Type.Object({
  service: Type.String(),
  bucket: Type.String(),
  key: Type.String(),
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
