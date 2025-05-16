import type { Client } from "gel";
import e from "../../dbschema/edgeql-js";
import { AuditEventService } from "../business/services/audit-event-service";
import { AwsCloudTrailLakeService } from "../business/services/aws/aws-cloudtrail-lake-service";
import { IPLookupService } from "../business/services/ip-lookup-service";
import { updateDataEgressRecordByReleaseKey } from "../business/services/releases/helpers/release-data-egress-helper";
import { ReleaseDataEgressService } from "../business/services/releases/release-data-egress-service";
import { setupWorkerFromConfigJson } from "./worker-bootstrap";

declare var self: Worker;

self.onmessage = (event: MessageEvent) => {
  return egressUpdateHandler(event.data);
};

async function egressUpdateHandler(configJson: any) {
  const { dc, logger } = await setupWorkerFromConfigJson(
    configJson,
    "data-egress-update-handler",
  );

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
        await edgeDbClient.transaction(
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
}
