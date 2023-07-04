import { Static, Type } from "@sinclair/typebox";

export const S3 = "S3";
export const GCP = "GCP";
export const R2 = "R2";

/**
 * The type a storage can be.
 */
export const CloudStorageSchema = Type.Union([
  Type.Literal(S3),
  Type.Literal(GCP),
  Type.Literal(R2),
]);
export type CloudStorageType = Static<typeof CloudStorageSchema>;

export type HeadOutput = {
  contentLength?: number;
  lastModified?: Date;
  properties: { [key: string]: any };
};

/**
 * Define a general storage interface.
 */
export interface CloudStorage {
  /**
   * Upload an object.
   */
  put(
    bucket: string,
    key: string,
    data: string
  ): Promise<{ [key: string]: any }>;

  /**
   * Get the metadata for the object.
   */
  head(bucket: string, key: string): Promise<HeadOutput>;
}
