import { inject, injectable } from "tsyringe";
import { AwsEnabledService } from "./aws-enabled-service";
import { CloudStorage, HeadOutput } from "../cloud-storage-service";
import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

@injectable()
export class AwsS3Service implements CloudStorage {
  constructor(
    @inject("S3Client") private readonly s3Client: S3Client,
    private readonly awsEnabledService: AwsEnabledService
  ) {}

  public async put(
    bucket: string,
    key: string,
    data: string
  ): Promise<{ [key: string]: any }> {
    await this.awsEnabledService.enabledGuard();

    const input = {
      Body: data,
      Bucket: bucket,
      Key: key,
    };
    const command = new PutObjectCommand(input);

    return await this.s3Client.send(command);
  }

  public async head(bucket: string, key: string): Promise<HeadOutput> {
    await this.awsEnabledService.enabledGuard();

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
