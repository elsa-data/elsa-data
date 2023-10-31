import {
  releaseGetByReleaseKey,
  updateLastDataEgressQueryTimestamp,
  updateReleaseDataEgress,
} from "../../../../../dbschema/queries";
import { Transaction } from "edgedb/dist/transaction";
import e from "../../../../../dbschema/edgeql-js";
import { IPLookupService } from "../../ip-lookup-service";

export type ReleaseEgressRecords = {
  releaseKey: string;
  description: string;
  auditId?: string;
  egressId: string;

  occurredDateTime: Date;
  sourceIpAddress: string;
  sourceLocation?: string;

  egressBytes: number;
  fileUrl: string;
};

export interface IQueryEgressRecordsProvider {
  getNewEgressRecords(props: {
    releaseKey: string;
    datasetUrisArray: string[];
    currentDate: Date;
    lastEgressUpdate?: Date;
  }): Promise<ReleaseEgressRecords[]>;
}

/**
 * The function will fetch the last egress timestamp update from Db
 * @param tx
 * @param releaseKey
 * @returns Date on when last query timestamp
 */
export const getLatestEgressRecordUpdate = async (
  tx: Transaction,
  releaseKey: string,
): Promise<Date> => {
  const releaseDates = await e
    .select(e.release.Release, (r) => ({
      created: true,
      lastDataEgressQueryTimestamp: true,
      filter: e.op(r.releaseKey, "=", releaseKey),
    }))
    .assert_single()
    .run(tx);

  if (!releaseDates) {
    throw new Error("No release found!");
  }

  if (releaseDates.lastDataEgressQueryTimestamp)
    return releaseDates.lastDataEgressQueryTimestamp;

  return releaseDates.created;
};

export const updateDataEgressRecordByReleaseKey = async ({
  tx,
  dataEgressQueryService,
  ipLookupService,
  releaseKey,
}: {
  tx: Transaction;
  dataEgressQueryService: IQueryEgressRecordsProvider;
  ipLookupService: IPLookupService;
  releaseKey: string;
}) => {
  const endQueryDate = new Date();

  // We need to know what dataset Ids array
  const datasetUrisArray = (
    await releaseGetByReleaseKey(tx, {
      releaseKey,
    })
  )?.datasetUris;
  if (!datasetUrisArray) throw new Error("No dataset found!");

  const newRecords = await dataEgressQueryService.getNewEgressRecords({
    releaseKey,
    datasetUrisArray,
    currentDate: endQueryDate,
    lastEgressUpdate: await getLatestEgressRecordUpdate(tx, releaseKey),
  });

  for (const r of newRecords) {
    await updateReleaseDataEgress(tx, {
      ...r,
      sourceLocation: ipLookupService.getLocationByIp(r.sourceIpAddress),
    });
  }

  // Update last query date to release record
  await updateLastDataEgressQueryTimestamp(tx, {
    releaseKey,
    lastQueryTimestamp: endQueryDate,
  });
};
