import * as edgedb from "edgedb";
import { container } from "tsyringe";
import { S3Client } from "@aws-sdk/client-s3";
import { CloudFormationClient } from "@aws-sdk/client-cloudformation";
import { ElsaSettings } from "./config/elsa-settings";
import { AuditLogService } from "./business/services/audit-log-service";
import { AGService } from "./business/services/ag-service";
import { AwsAccessPointService } from "./business/services/aws-access-point-service";
import { AwsPresignedUrlsService } from "./business/services/aws-presigned-urls-service";
import { DatasetService } from "./business/services/dataset-service";
import { JobsService } from "./business/services/jobs-service";

export function registerTypes() {
  container.register<edgedb.Client>("Database", {
    useFactory: () => edgedb.createClient(),
  });

  container.register<S3Client>("S3Client", {
    useFactory: () => new S3Client({}),
  });

  container.register<CloudFormationClient>("CloudFormationClient", {
    useFactory: () => new CloudFormationClient({}),
  });
}
