import e from "../../../dbschema/edgeql-js";
import { DependencyContainer } from "tsyringe";
import { insertSystemAuditEvent } from "../../../dbschema/queries";
import { getServices } from "../../di-helpers";

import {
  insert10G,
  TENG_DESCRIPTION,
  TENG_URI,
} from "../dataset/insert-test-data-10g";
import { insert10F } from "../dataset/insert-test-data-10f";
import { insert10C } from "../dataset/insert-test-data-10c";
import { insertGs } from "../dataset/insert-test-data-gs";
import {
  insertBlankDataset,
  makeEmptyIdentifierArray,
  makeSystemlessIdentifierArray,
} from "../util/test-data-helpers";

import { insertUser1 } from "../user/insert-user1";
import { insertUser2 } from "../user/insert-user2";
import { insertUser3 } from "../user/insert-user3";

import { insertRelease1 } from "../release/insert-test-data-release1";
import { insertRelease2 } from "../release/insert-test-data-release2";
import { insertRelease3 } from "../release/insert-test-data-release3";
import { insertRelease4 } from "../release/insert-test-data-release4";
import { insertRelease5 } from "../release/insert-test-data-release5";
import { blankTestData } from "../util/blank-test-data";
import { insertUser4 } from "../user/insert-user4";
import { DatasetService } from "../../business/services/dataset-service";
import { S3IndexApplicationService } from "../../business/services/australian-genomics/s3-index-import-service";
import { UserService } from "../../business/services/user-service";
import { insertUser5 } from "../user/insert-user5";
import {
  SMARTIE_DATASET_CONFIG,
  SMARTIE_DESCRIPTION,
  SMARTIE_URI,
} from "../dataset/insert-test-data-smartie";
import { addMocksForInMemory } from "../aws-mock/add-s3-mocks-for-in-memory";
import { insertRelease6 } from "../release/insert-test-data-release6";

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

/**
 * Inserting a set of data in scenario 1

 * It consists of inserting a couple of dataset linked to releases
 *
 * This scenario is used as part of E2E testing
 *
 * @param dc
 */
export async function insertScenario1(dc: DependencyContainer) {
  const { logger, edgeDbClient, settings } = getServices(dc);

  // Clear all records if any before filling it up
  await blankTestData();

  // Some user records created
  const superAdmin = await insertUser1(dc);
  const administrator = await insertUser2(dc);
  const manager = await insertUser3(dc);
  const member = await insertUser4(dc);
  const datasetAdministrator = await insertUser5(dc);

  const userService = dc.resolve(UserService);

  const datasetAdministratorUser = await userService.getBySubjectId(
    datasetAdministrator.subjectId
  );

  if (!datasetAdministratorUser)
    throw new Error("Basic scenario users are missing");

  // Create datasets record
  const s3IndexService = dc.resolve(S3IndexApplicationService);

  // because this dataset *only* exists as a set of mocks for AWS - if we actually want
  // to do localhost dev in AWS (so no mocks) we need to not load this
  if (settings.devTesting?.mockAwsCloud) {
    // the Smartie dataset is a super tiny dataset that actually exists in the filesystem
    // but we proxy it to pretend it exists in a mocked AWS bucket
    {
      // this shouldn't be necessary - the synchronise service should upset this from the config files
      await e
        .insert(e.dataset.Dataset, {
          uri: SMARTIE_URI,
          externalIdentifiers: makeSystemlessIdentifierArray("Smartie"),
          description: SMARTIE_DESCRIPTION,
          cases: e.set(),
        })
        .run(edgeDbClient);

      await s3IndexService.syncWithDatabaseFromDatasetUri(
        SMARTIE_URI,
        SMARTIE_DATASET_CONFIG
      );
    }
  }

  /*  {
    // this shouldn't be necessary - the synchronise service should upsert this from the config files
    await e
      .insert(e.dataset.Dataset, {
        uri: TENG_URI,
        externalIdentifiers: makeSystemlessIdentifierArray("10G"),
        description: TENG_DESCRIPTION,
        cases: e.set(),
      })
      .run(edgeDbClient);

    await s3IndexService.syncWithDatabaseFromDatasetUri(
      TENG_URI,
      datasetAdministratorUser,
      "australian-genomics-directories"
    );
  } */

  const ten_f_uri = await insert10F(dc);
  const ten_c_uri = await insert10C(dc);
  const ten_g_uri = await insert10G(dc);
  const gs_uri = await insertGs(dc);

  // Some blank DB records inserted to see how it looks like
  for (const dbProp of BLANK_DB_PROPS) {
    await insertBlankDataset(dbProp.id, dbProp.uri);
  }

  // Create mock releases
  const r1 = await insertRelease1(dc, {
    releaseAdministrator: [administrator],
    releaseManager: [manager],
    releaseMember: [member],
    datasetUris: [TENG_URI, ten_f_uri, ten_c_uri],
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
    datasetUris: [TENG_URI],
  });
  const r5 = await insertRelease5(dc, {
    releaseAdministrator: [administrator],
    releaseManager: [manager],
    releaseMember: [member],
    datasetUris: [ten_f_uri],
  });
  const r6 = await insertRelease6(dc, {
    releaseAdministrator: [administrator],
    releaseManager: [manager],
    releaseMember: [member],
    datasetUris: [SMARTIE_URI],
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
