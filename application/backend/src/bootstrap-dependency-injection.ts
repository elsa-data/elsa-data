import * as edgedb from "edgedb";
import * as tsyringe from "tsyringe";
import { instanceCachingFactory } from "tsyringe";
import { IPresignedUrlProvider } from "./business/services/presigned-url-service";
import { AwsPresignedUrlService } from "./business/services/aws/aws-presigned-url-service";
import { GcpPresignedUrlService } from "./business/services/gcp-presigned-url-service";
import { CloudflarePresignedUrlService } from "./business/services/cloudflare-presigned-url-service";
import { bootstrapDependencyInjectionAwsClients } from "./bootstrap-dependency-injection-aws-clients";
import { bootstrapDependencyInjectionSingletonServices } from "./bootstrap-dependency-injection-singleton-services";

/**
 * Bootstrap the DI with some basic services that are
 * available across the entire application.
 */
export async function bootstrapDependencyInjection(mockAws: boolean = false) {
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

  await bootstrapDependencyInjectionAwsClients(dc, mockAws);

  bootstrapDependencyInjectionSingletonServices(dc, mockAws);

  dc.register<IPresignedUrlProvider>("IPresignedUrlProvider", {
    useClass: AwsPresignedUrlService,
  });
  dc.register<IPresignedUrlProvider>("IPresignedUrlProvider", {
    useClass: GcpPresignedUrlService,
  });
  dc.register<IPresignedUrlProvider>("IPresignedUrlProvider", {
    useClass: CloudflarePresignedUrlService,
  });

  // Note: dependencies of class constructors must be injected manually when using esbuild.
  return dc;
}
