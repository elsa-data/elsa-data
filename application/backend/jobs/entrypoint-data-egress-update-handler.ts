import "reflect-metadata";
import { Client } from "edgedb";
import { bootstrapDependencyInjection } from "../src/bootstrap-dependency-injection";
import { ElsaSettings } from "../src/config/elsa-settings";
import { sleep } from "edgedb/dist/utils";
import { workerData as breeWorkerData } from "node:worker_threads";
import { bootstrapSettings } from "../src/bootstrap-settings";
import { getDirectConfig } from "../src/config/config-load";
import pino, { Logger } from "pino";
import e from "../dbschema/edgeql-js";

import { getFeaturesEnabled } from "../src/features";
import { ReleaseDataEgressService } from "../src/business/services/releases/release-data-egress-service";
import { AuditEventService } from "../src/business/services/audit-event-service";
import { AwsCloudTrailLakeService } from "../src/business/services/aws/aws-cloudtrail-lake-service";
import { NotAuthorisedUpdateDataEgressRecords } from "../src/business/exceptions/audit-authorisation";
import { updateDataEgressRecordByReleaseKey } from "../src/business/services/releases/helpers/release-data-egress-helper";
import { IPLookupService } from "../src/business/services/ip-lookup-service";

(async () => {
  const rawConfig = await getDirectConfig(breeWorkerData.job.worker.workerData);

  const settings = await bootstrapSettings(rawConfig);

  // we create a logger that always has a field telling us that the context was the
  // job handler - allows us to separate out job logs in CloudWatch
  const logger = pino(settings.logger).child({ context: "job-handler" });

  // global settings for DI
  const dc = await bootstrapDependencyInjection(
    logger,
    settings.devTesting?.mockAwsCloud,
  );

  dc.register<ElsaSettings>("Settings", {
    useValue: settings,
  });

  dc.register<Logger>("Logger", {
    useValue: logger,
  });

  const features = await getFeaturesEnabled(dc, settings);
  dc.register<ReadonlySet<string>>("Features", {
    useValue: features,
  });

  const edgeDbClient = dc.resolve<Client>("Database");

  const auditEventService = dc.resolve(AuditEventService);
  const awsCloudTrailLakeService = dc.resolve(AwsCloudTrailLakeService);
  const ipLookupService = dc.resolve(IPLookupService);
  const releaseDataEgressService = dc.resolve(ReleaseDataEgressService);

  // We need to get all releases in the system
  const releasesDetails = await e
    .select(e.release.Release, (r) => ({
      releaseKey: true,
      datasetUris: true,
    }))
    .run(edgeDbClient);

  // Iterate releaseKey and trigger update egress records
  for (const rd of releasesDetails) {
    await auditEventService.systemAuditEventPattern(
      "update egress record periodically",
      async (completeAuditFn) => {
        edgeDbClient.transaction(
          async (tx) =>
            await updateDataEgressRecordByReleaseKey({
              tx: tx,
              dataEgressQueryService: awsCloudTrailLakeService,
              ipLookupService: ipLookupService,
              releaseKey: rd.releaseKey,
            }),
        );
      },
    );
  }
})();
