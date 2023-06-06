import * as edgedb from "edgedb";
import * as tsyringe from "tsyringe";
import { instanceCachingFactory } from "tsyringe";
import { S3Client } from "@aws-sdk/client-s3";
import { CloudFormationClient } from "@aws-sdk/client-cloudformation";
import { CloudTrailClient } from "@aws-sdk/client-cloudtrail";
import { SES } from "@aws-sdk/client-ses";
import {
  IPresignedUrlProvider,
  PresignedUrlService,
} from "./business/services/presigned-url-service";
import { AwsPresignedUrlService } from "./business/services/aws/aws-presigned-url-service";
import { GcpPresignedUrlService } from "./business/services/gcp-presigned-url-service";
import { CloudflarePresignedUrlService } from "./business/services/cloudflare-presigned-url-service";
import { ServiceDiscoveryClient } from "@aws-sdk/client-servicediscovery";
import { SFNClient } from "@aws-sdk/client-sfn";
import { STSClient } from "@aws-sdk/client-sts";
import { AwsDiscoveryService } from "./business/services/aws/aws-discovery-service";
import { AwsEnabledService } from "./business/services/aws/aws-enabled-service";
import { AwsS3Service } from "./business/services/aws/aws-s3-service";
import { AwsAccessPointService } from "./business/services/aws/aws-access-point-service";
import { AwsCloudTrailLakeService } from "./business/services/aws/aws-cloudtrail-lake-service";
import { GcpEnabledService } from "./business/services/gcp-enabled-service";
import { GcpStorageSharingService } from "./business/services/gcp-storage-sharing-service";
import { S3 } from "./business/services/cloud-storage-service";
import { ManifestService } from "./business/services/manifests/manifest-service";
import { S3ManifestHtsgetService } from "./business/services/manifests/htsget/manifest-htsget-service";
import { AuditEventTimedService } from "./business/services/audit-event-timed-service";
import { SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { bootstrapDependencyInjectionAwsClients } from "./bootstrap-dependency-injection-aws-clients";

/**
 * Bootstrap the DI with some basic services that are
 * available across the entire application.
 */
export function bootstrapDependencyInjection() {
  // this should be the ONLY point where we use the global tsyringe container -
  // all subsequent dcs should be passed into us - never using the global "container"
  // (that is why we call it "dc" throughout so we can do easy searches for places
  // where we have accidentally imported the global container
  // see our build scripts for where we abort if detecting this regexp)
  const dc = tsyringe.container.createChildContainer();

  dc.register<edgedb.Client>("Database", {
    // we want a single instance of the edgedb client as that then will establish a
    // shared connection pool that is effective
    // https://www.edgedb.com/docs/clients/js/driver#configuring-clients
    useFactory: instanceCachingFactory(() =>
      edgedb.createClient().withConfig({
        // we do some bioinformatics activities within a transaction context (looking up variants)
        // and the default 10 seconds sometimes is a bit short
        session_idle_transaction_timeout: edgedb.Duration.from({ seconds: 60 }),
      })
    ),
  });

  bootstrapDependencyInjectionAwsClients(dc);

  dc.register<IPresignedUrlProvider>("IPresignedUrlProvider", {
    useClass: AwsPresignedUrlService,
  });
  dc.register<IPresignedUrlProvider>("IPresignedUrlProvider", {
    useClass: GcpPresignedUrlService,
  });
  dc.register<IPresignedUrlProvider>("IPresignedUrlProvider", {
    useClass: CloudflarePresignedUrlService,
  });

  // we register our singletons this way as this is the only way to prevent them being registered
  // in the global container namespace (we DON'T use the @singleton decorator)
  dc.registerSingleton(AwsDiscoveryService);
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

  dc.registerSingleton<AuditEventTimedService>(
    "ReleaseAuditTimedService",
    AuditEventTimedService
  );

  dc.registerSingleton<S3ManifestHtsgetService>(S3, S3ManifestHtsgetService);

  // Note: dependencies of class constructors must be injected manually when using esbuild.
  return dc;
}
