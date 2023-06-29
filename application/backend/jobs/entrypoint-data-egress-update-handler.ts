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
import { ReleaseDataEgressService } from "../src/business/services/release-data-egress-service";
import { AuditEventService } from "../src/business/services/audit-event-service";
import { AwsCloudTrailLakeService } from "../src/business/services/aws/aws-cloudtrail-lake-service";
import { getSystemAuthUser } from "../src/entrypoint-command-helper";
import { NotAuthorisedUpdateDataEgressRecords } from "../src/business/exceptions/audit-authorisation";

(async () => {
  const rawConfig = await getDirectConfig(breeWorkerData.job.worker.workerData);

  // global settings for DI
  const dc = await bootstrapDependencyInjection(
    rawConfig.devTesting?.mockAwsCloud
  );

  const settings = await bootstrapSettings(rawConfig);

  // we create a logger that always has a field telling us that the context was the
  // job handler - allows us to separate out job logs in CloudWatch
  const logger = pino(settings.logger).child({ context: "job-handler" });
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

  // We need to get all releases in the system
  const releasesDetails = await e
    .select(e.release.Release, (r) => ({
      releaseKey: true,
      datasetUris: true,
    }))
    .run(edgeDbClient);

  const systemUser = await getSystemAuthUser(edgeDbClient);

  if (!systemUser) {
    throw new Error("system has no permission to update datasets");
  }

  // Iterate releaseKey and trigger update egress records
  for (const rd of releasesDetails) {
    await auditEventService.transactionalUpdateInReleaseAuditPattern(
      systemUser,
      rd.releaseKey,
      `System scheduled update data egress records: ${rd.releaseKey}`,
      async () => {
        if (!systemUser.isAllowedRefreshDatasetIndex)
          throw new NotAuthorisedUpdateDataEgressRecords();
      },
      async (tx, a) => {
        if (!rd.datasetUris) throw new Error("No dataset found!");
        await awsCloudTrailLakeService.fetchCloudTrailLakeLog({
          user: systemUser,
          releaseKey: rd.releaseKey,
          datasetUrisArray: rd.datasetUris,
        });
      },
      async () => {}
    );
  }
})();
