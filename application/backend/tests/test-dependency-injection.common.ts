import { container } from "tsyringe";
import { S3Client } from "@aws-sdk/client-s3";
import { CloudTrailClient } from "@aws-sdk/client-cloudtrail";
import { CloudFormationClient } from "@aws-sdk/client-cloudformation";
import * as edgedb from "edgedb";
import { ElsaSettings } from "../src/config/elsa-settings";
import { createTestElsaSettings } from "./test-elsa-settings.common";
import { Logger, pino } from "pino";
import { IPresignedUrlProvider } from "../src/business/services/presigned-urls-service";
import { AwsPresignedUrlsService } from "../src/business/services/aws/aws-presigned-urls-service";
import { GcpPresignedUrlsService } from "../src/business/services/gcp-presigned-urls-service";
import { CloudflarePresignedUrlsService } from "../src/business/services/cloudflare-presigned-urls-service";
import { SESClient } from "@aws-sdk/client-ses";
import { ServiceDiscoveryClient } from "@aws-sdk/client-servicediscovery";

export async function registerTypes() {
  // TO *REALLY* USE CHILD CONTAINERS WE'D NEED TO TEACH FASTIFY TO DO THE SAME SO FOR THE MOMENT
  // WE RETURN A CONTAINER IN ANTICIPATION OF ONE DAY DOING THAT

  const testContainer = container; //.createChildContainer();

  // we want an independent setup each call to this in testing (unlike in real code)
  testContainer.reset();

  testContainer.register<edgedb.Client>("Database", {
    useFactory: () => edgedb.createClient(),
  });

  testContainer.register<S3Client>("S3Client", {
    useFactory: () => new S3Client({}),
  });

  testContainer.register<CloudTrailClient>("CloudTrailClient", {
    useFactory: () => new CloudTrailClient({}),
  });

  testContainer.register<CloudFormationClient>("CloudFormationClient", {
    useFactory: () => new CloudFormationClient({}),
  });

  testContainer.register<SESClient>("SESClient", {
    useFactory: () => new SESClient({}),
  });

  testContainer.register<ServiceDiscoveryClient>("ServiceDiscoveryClient", {
    useFactory: () => new ServiceDiscoveryClient({}),
  });

  testContainer.register<ElsaSettings>("Settings", {
    useFactory: createTestElsaSettings,
  });

  testContainer.register<Logger>("Logger", {
    useValue: pino(createTestElsaSettings().logger),
  });

  testContainer.register<IPresignedUrlProvider>("IPresignedUrlProvider", {
    useClass: AwsPresignedUrlsService,
  });

  testContainer.register<IPresignedUrlProvider>("IPresignedUrlProvider", {
    useClass: GcpPresignedUrlsService,
  });

  testContainer.register<IPresignedUrlProvider>("IPresignedUrlProvider", {
    useClass: CloudflarePresignedUrlsService,
  });

  return testContainer;
}
