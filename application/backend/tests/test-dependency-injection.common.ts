import * as tsyringe from "tsyringe";
import * as edgedb from "edgedb";
import { ElsaSettings } from "../src/config/elsa-settings";
import { createTestElsaSettings } from "./test-elsa-settings.common";
import { Logger, pino } from "pino";
import {
  IPresignedUrlProvider,
  PresignedUrlService,
} from "../src/business/services/presigned-url-service";
import { GcpPresignedUrlService } from "../src/business/services/gcp-presigned-url-service";
import { CloudflarePresignedUrlService } from "../src/business/services/cloudflare-presigned-url-service";
import { AwsPresignedUrlService } from "../src/business/services/aws/aws-presigned-url-service";
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
import { AuditEventTimedService } from "../src/business/services/audit-event-timed-service";
import { bootstrapDependencyInjectionAwsClients } from "../src/bootstrap-dependency-injection-aws-clients";

export function registerTypes() {
  // TO *REALLY* USE CHILD CONTAINERS WE'D NEED TO TEACH FASTIFY TO DO THE SAME SO FOR THE MOMENT
  // WE RETURN A CONTAINER IN ANTICIPATION OF ONE DAY DOING THAT

  const testContainer = tsyringe.container; //.createChildContainer();

  // we want an independent setup each call to this in testing (unlike in real code)
  testContainer.reset();

  testContainer.register<edgedb.Client>("Database", {
    useFactory: () => edgedb.createClient(),
  });

  bootstrapDependencyInjectionAwsClients(testContainer);

  testContainer.register<ElsaSettings>("Settings", {
    useFactory: createTestElsaSettings,
  });

  testContainer.register<Logger>("Logger", {
    useValue: pino(createTestElsaSettings().logger),
  });

  testContainer.register<ReadonlySet<string>>("Features", {
    useValue: new Set<string>(),
  });

  testContainer.register<IPresignedUrlProvider>("IPresignedUrlProvider", {
    useClass: AwsPresignedUrlService,
  });

  testContainer.register<IPresignedUrlProvider>("IPresignedUrlProvider", {
    useClass: GcpPresignedUrlService,
  });

  testContainer.register<IPresignedUrlProvider>("IPresignedUrlProvider", {
    useClass: CloudflarePresignedUrlService,
  });

  testContainer.registerSingleton(AwsDiscoveryService);
  testContainer.registerSingleton(AwsEnabledService);
  testContainer.registerSingleton(AwsPresignedUrlService);
  testContainer.registerSingleton(AwsS3Service);
  testContainer.registerSingleton(AwsAccessPointService);
  testContainer.registerSingleton(AwsCloudTrailLakeService);
  testContainer.registerSingleton(GcpEnabledService);
  testContainer.registerSingleton(GcpStorageSharingService);
  testContainer.registerSingleton(GcpPresignedUrlService);
  testContainer.registerSingleton(CloudflarePresignedUrlService);
  testContainer.registerSingleton(ManifestService);
  testContainer.registerSingleton(PresignedUrlService);

  testContainer.registerSingleton<AuditEventTimedService>(
    "ReleaseAuditTimedService",
    AuditEventTimedService
  );

  testContainer.registerSingleton<S3ManifestHtsgetService>(
    S3,
    S3ManifestHtsgetService
  );

  return testContainer;
}
