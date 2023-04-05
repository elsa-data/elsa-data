import * as tsyringe from "tsyringe";
import { S3Client } from "@aws-sdk/client-s3";
import { CloudTrailClient } from "@aws-sdk/client-cloudtrail";
import { CloudFormationClient } from "@aws-sdk/client-cloudformation";
import * as edgedb from "edgedb";
import { ElsaSettings } from "../src/config/elsa-settings";
import { createTestElsaSettings } from "./test-elsa-settings.common";
import { Logger, pino } from "pino";
import {
  IPresignedUrlProvider,
  PresignedUrlsService,
} from "../src/business/services/presigned-urls-service";
import { GcpPresignedUrlsService } from "../src/business/services/gcp-presigned-urls-service";
import { CloudflarePresignedUrlsService } from "../src/business/services/cloudflare-presigned-urls-service";
import { SESClient } from "@aws-sdk/client-ses";
import { ServiceDiscoveryClient } from "@aws-sdk/client-servicediscovery";
import { AwsPresignedUrlsService } from "../src/business/services/aws/aws-presigned-urls-service";
import { AwsDiscoveryService } from "../src/business/services/aws/aws-discovery-service";
import { AwsEnabledService } from "../src/business/services/aws/aws-enabled-service";
import { AwsS3Service } from "../src/business/services/aws/aws-s3-service";
import { AwsAccessPointService } from "../src/business/services/aws/aws-access-point-service";
import { AwsCloudTrailLakeService } from "../src/business/services/aws/aws-cloudtrail-lake-service";
import { GcpEnabledService } from "../src/business/services/gcp-enabled-service";
import { GcpStorageSharingService } from "../src/business/services/gcp-storage-sharing-service";
import { ManifestService } from "../src/business/services/manifests/manifest-service";
import { S3 } from "../src/business/services/cloud-storage-service";
import { S3ManifestHtsgetService } from "../src/business/services/manifests/htsget/manifest-htsget-service";
import { STSClient } from "@aws-sdk/client-sts";
import { SFNClient } from "@aws-sdk/client-sfn";

export function registerTypes() {
  // TO *REALLY* USE CHILD CONTAINERS WE'D NEED TO TEACH FASTIFY TO DO THE SAME SO FOR THE MOMENT
  // WE RETURN A CONTAINER IN ANTICIPATION OF ONE DAY DOING THAT

  const testContainer = tsyringe.container; //.createChildContainer();

  // we want an independent setup each call to this in testing (unlike in real code)
  testContainer.reset();

  const awsClientConfig = {};

  testContainer.register<edgedb.Client>("Database", {
    useFactory: () => edgedb.createClient(),
  });

  testContainer.register<S3Client>("S3Client", {
    useFactory: () => new S3Client(awsClientConfig),
  });

  testContainer.register<CloudTrailClient>("CloudTrailClient", {
    useFactory: () => new CloudTrailClient(awsClientConfig),
  });

  testContainer.register<CloudFormationClient>("CloudFormationClient", {
    useFactory: () => new CloudFormationClient(awsClientConfig),
  });

  testContainer.register<SESClient>("SESClient", {
    useFactory: () => new SESClient(awsClientConfig),
  });

  testContainer.register<ServiceDiscoveryClient>("ServiceDiscoveryClient", {
    useFactory: () => new ServiceDiscoveryClient(awsClientConfig),
  });

  testContainer.register<STSClient>("STSClient", {
    useFactory: () => new STSClient(awsClientConfig),
  });

  testContainer.register<SFNClient>("SFNClient", {
    useFactory: () => new SFNClient({}),
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

  testContainer.registerSingleton(AwsDiscoveryService);
  testContainer.registerSingleton(AwsEnabledService);
  testContainer.registerSingleton(AwsPresignedUrlsService);
  testContainer.registerSingleton(AwsS3Service);
  testContainer.registerSingleton(AwsAccessPointService);
  testContainer.registerSingleton(AwsCloudTrailLakeService);
  testContainer.registerSingleton(GcpEnabledService);
  testContainer.registerSingleton(GcpStorageSharingService);
  testContainer.registerSingleton(GcpPresignedUrlsService);
  testContainer.registerSingleton(CloudflarePresignedUrlsService);
  testContainer.registerSingleton(ManifestService);
  testContainer.registerSingleton(PresignedUrlsService);

  testContainer.registerSingleton<S3ManifestHtsgetService>(
    S3,
    S3ManifestHtsgetService
  );

  return testContainer;
}
