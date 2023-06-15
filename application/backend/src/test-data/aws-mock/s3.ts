import { mockClient } from "aws-sdk-client-mock";
import { S3Client } from "@aws-sdk/client-s3";

export function createMockS3() {
  const s3ClientMock = mockClient(S3Client);

  return s3ClientMock;
}
