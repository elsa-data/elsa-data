import * as tsyringe from "tsyringe";
import * as edgedb from "edgedb";
import { ElsaSettings } from "../src/config/elsa-settings";
import { createTestElsaSettings } from "./test-elsa-settings.common";
import { Logger, pino } from "pino";
import { IPresignedUrlProvider } from "../src/business/services/presigned-url-service";
import { GcpPresignedUrlService } from "../src/business/services/gcp-presigned-url-service";
import { CloudflarePresignedUrlService } from "../src/business/services/cloudflare-presigned-url-service";
import { AwsPresignedUrlService } from "../src/business/services/aws/aws-presigned-url-service";
import { bootstrapDependencyInjectionAwsClients } from "../src/bootstrap-dependency-injection-aws-clients";
import { bootstrapDependencyInjectionSingletonServices } from "../src/bootstrap-dependency-injection-singleton-services";

export function registerTypes() {
  // TO *REALLY* USE CHILD CONTAINERS WE'D NEED TO TEACH FASTIFY TO DO THE SAME SO FOR THE MOMENT
  // WE RETURN A CONTAINER IN ANTICIPATION OF ONE DAY DOING THAT

  const testContainer = tsyringe.container; //.createChildContainer();

  // we want an independent setup each call to this in testing (unlike in real code)
  testContainer.reset();

  testContainer.register<edgedb.Client>("Database", {
    useFactory: () => edgedb.createClient(),
  });

  bootstrapDependencyInjectionAwsClients(testContainer, false);

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

  bootstrapDependencyInjectionSingletonServices(testContainer, true);

  return testContainer;
}
