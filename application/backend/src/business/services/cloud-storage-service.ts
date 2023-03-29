import { container, injectable } from "tsyringe";
import { Static, Type } from "@sinclair/typebox";
import { AwsS3Service } from "./aws/aws-s3-service";

/**
 * The type a storage can be.
 */
export const CloudStorageSchema = Type.Union([
  Type.Literal("S3"),
  Type.Literal("GCP"),
  Type.Literal("R2"),
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

@injectable()
export class CloudStorageFactory {
  /**
   * Build a storage object
   */
  public getStorage(type: CloudStorageType): CloudStorage | null {
    if (type === "S3") {
      return container.resolve(AwsS3Service);
    } else {
      return null;
    }
  }
}
