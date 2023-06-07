import { DependencyContainer } from "tsyringe";
import { AwsDiscoveryService } from "./business/services/aws/aws-discovery-service";
import { AwsEnabledService } from "./business/services/aws/aws-enabled-service";
import { AwsPresignedUrlService } from "./business/services/aws/aws-presigned-url-service";
import { AwsS3Service } from "./business/services/aws/aws-s3-service";
import { AwsAccessPointService } from "./business/services/aws/aws-access-point-service";
import { AwsCloudTrailLakeService } from "./business/services/aws/aws-cloudtrail-lake-service";
import { GcpEnabledService } from "./business/services/gcp-enabled-service";
import { GcpStorageSharingService } from "./business/services/gcp-storage-sharing-service";
import { GcpPresignedUrlService } from "./business/services/gcp-presigned-url-service";
import { CloudflarePresignedUrlService } from "./business/services/cloudflare-presigned-url-service";
import { ManifestService } from "./business/services/manifests/manifest-service";
import { PresignedUrlService } from "./business/services/presigned-url-service";
import { AuditEventTimedService } from "./business/services/audit-event-timed-service";
import { S3ManifestHtsgetService } from "./business/services/manifests/htsget/manifest-htsget-service";
import { S3 } from "./business/services/cloud-storage-service";

/**
 * Register singleton instances of all services that should be singleton.
 */
export function bootstrapDependencyInjectionSingletonServices(
  dc: DependencyContainer,
  mockAws: boolean
) {
  // we register our singletons this way as this is the only way to prevent them being registered
  // in the global container namespace (we DON'T use the @singleton decorator)
  dc.registerSingleton(AwsEnabledService);
  dc.registerSingleton(AwsPresignedUrlService);
  dc.registerSingleton(AwsS3Service);
  dc.registerSingleton(AwsAccessPointService);
  dc.registerSingleton(AwsCloudTrailLakeService);
  dc.registerSingleton(GcpEnabledService);
  dc.registerSingleton(GcpStorageSharingService);
  dc.registerSingleton(GcpPresignedUrlService);
  dc.registerSingleton(CloudflarePresignedUrlService);
  dc.registerSingleton(ManifestService);
  dc.registerSingleton(PresignedUrlService);

  dc.registerSingleton(AwsDiscoveryService);
  dc.registerSingleton("IAwsDiscoveryService", AwsDiscoveryService);

  dc.registerSingleton<AuditEventTimedService>(
    "ReleaseAuditTimedService",
    AuditEventTimedService
  );

  dc.registerSingleton<S3ManifestHtsgetService>(S3, S3ManifestHtsgetService);
}
