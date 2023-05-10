import e from "../../../dbschema/edgeql-js";
import { DependencyContainer } from "tsyringe";
import { insertSystemAuditEvent } from "../../../dbschema/queries";
import { getServices } from "../../di-helpers";

import { insert10G } from "../dataset/insert-test-data-10g";
import { insert10F } from "../dataset/insert-test-data-10f";
import { insert10C } from "../dataset/insert-test-data-10c";
import { insertGs } from "../dataset/insert-test-data-gs";
import { insertBlankDataset } from "../util/test-data-helpers";

import { insertUser1 } from "../user/insert-user1";
import { insertUser2 } from "../user/insert-user2";
import { insertUser3 } from "../user/insert-user3";

import { insertRelease1 } from "../release/insert-test-data-release1";
import { insertRelease2 } from "../release/insert-test-data-release2";
import { insertRelease3 } from "../release/insert-test-data-release3";
import { insertRelease4 } from "../release/insert-test-data-release4";
import { insertRelease5 } from "../release/insert-test-data-release5";
import { blankTestData } from "../util/blank-test-data";

const BLANK_DB_PROPS = [
  { id: "10M", uri: "urn:fdc:umccr.org:2022:dataset/10m" },
  { id: "BM", uri: "urn:fdc:australiangenomics.org.au:2022:datasets/bm" },
  { id: "MITO", uri: "urn:fdc:umccr.org:2022:dataset/mito" },
  { id: "BOW", uri: "urn:fdc:umccr.org:2022:dataset/bow" },
  { id: "RR", uri: "urn:fdc:umccr.org:2022:dataset/rr" },
  { id: "SS", uri: "urn:fdc:umccr.org:2022:dataset/ss" },
  { id: "TT", uri: "urn:fdc:umccr.org:2022:dataset/tt" },
  { id: "UU", uri: "urn:fdc:umccr.org:2022:dataset/uu" },
  { id: "VV", uri: "urn:fdc:umccr.org:2022:dataset/vv" },
  { id: "WW", uri: "urn:fdc:umccr.org:2022:dataset/ww" },
  { id: "XX", uri: "urn:fdc:umccr.org:2022:dataset/xx" },
  { id: "YY", uri: "urn:fdc:umccr.org:2022:dataset/yy" },
  { id: "ZZ", uri: "urn:fdc:umccr.org:2022:dataset/zz" },
];

export async function insertScenario1(dc: DependencyContainer) {
  const { logger, edgeDbClient } = getServices(dc);

  // Clear all records if any before filling it up
  await blankTestData();

  // Some user records created
  const superAdmin = await insertUser1(dc);
  const administrator = await insertUser2(dc);
  const manager = await insertUser3(dc);

  // Create datasets record
  const ten_g_uri = await insert10G(dc);
  const ten_f_uri = await insert10F(dc);
  const ten_c_uri = await insert10C(dc);
  const gs_uri = await insertGs(dc);
  // await insertCARDIAC();

  // Some blank DB records inserted to see how it looks like
  for (const dbProp of BLANK_DB_PROPS) {
    await insertBlankDataset(dbProp.id, dbProp.uri);
  }

  // Create mock releases
  const r1 = await insertRelease1(dc, {
    releaseAdministrator: [administrator],
    releaseManager: [manager],
    releaseMember: [],
    datasetUris: [ten_g_uri, ten_f_uri, ten_c_uri],
  });
  const r2 = await insertRelease2(dc, {
    releaseAdministrator: [administrator],
    releaseManager: [],
    releaseMember: [],
    datasetUris: [ten_f_uri],
  });
  const r3 = await insertRelease3(dc, {
    releaseAdministrator: [administrator],
    releaseManager: [],
    releaseMember: [],
    datasetUris: [ten_f_uri],
  });
  const r4 = await insertRelease4(dc, {
    releaseAdministrator: [administrator],
    releaseManager: [],
    releaseMember: [],
    datasetUris: [ten_f_uri],
  });
  const r5 = await insertRelease5(dc, {
    releaseAdministrator: [administrator],
    releaseManager: [manager],
    releaseMember: [],
    datasetUris: [ten_f_uri],
  });

  logger.debug(
    `insertTestData: Number of object artifacts present = ${await e
      .count(e.lab.ArtifactBase)
      .run(edgeDbClient)}`
  );
  logger.debug(
    `insertTestData: Number of users present = ${await e
      .count(e.permission.User)
      .run(edgeDbClient)}`
  );
  logger.debug(
    `insertTestData: Number of runs present = ${await e
      .count(e.lab.Run)
      .run(edgeDbClient)}`
  );
  logger.debug(
    `insertTestData: Number of releases present = ${await e
      .count(e.release.Release)
      .run(edgeDbClient)}`
  );

  //const eachDs = e.for(e.dataset.Dataset, (ds) => {
  //  return e.select({
  //    dataset: ds.uri,
  //    casesCount: e.count(ds.cases),
  //    patientsCount: e.count(ds.cases.patients),
  //     specimensCount: e.count(ds.cases.patients.specimens),
  //  });
  // });
  //console.log(await eachDs.run(edgeDbClient));

  await insertSystemAuditEvent(edgeDbClient, {
    actionCategory: "E",
    actionDescription: "Email Sent",
  });
}
