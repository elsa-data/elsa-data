import { inject, injectable } from "tsyringe";
import { AwsBaseService } from "./aws-base-service";
import { CloudStorage, HeadOutput } from "../cloud-storage-service";
import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

@injectable()
export class AwsS3Service extends AwsBaseService implements CloudStorage {
  constructor(@inject("S3Client") private readonly s3Client: S3Client) {
    super();
  }

  async put(
    bucket: string,
    key: string,
    data: string
  ): Promise<{ [key: string]: any }> {
    this.enabledGuard();

    const input = {
      Body: data,
      Bucket: bucket,
      Key: key,
    };
    const command = new PutObjectCommand(input);

    return await this.s3Client.send(command);
  }

  async head(bucket: string, key: string): Promise<HeadOutput> {
    this.enabledGuard();

    const input = {
      Bucket: bucket,
      Key: key,
    };
    const command = new HeadObjectCommand(input);

    const output = await this.s3Client.send(command);
    return {
      contentLength: output.ContentLength,
      lastModified: output.LastModified,
      properties: output,
    };
  }
}
