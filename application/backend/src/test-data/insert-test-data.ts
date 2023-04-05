import e from "../../dbschema/edgeql-js";
import { insert10G } from "./insert-test-data-10g";
import { createTestUser, insertBlankDataset } from "./test-data-helpers";
import { insert10F } from "./insert-test-data-10f";
import { insert10C } from "./insert-test-data-10c";
import { insertGs } from "./insert-test-data-gs";
import { insertRelease1 } from "./insert-test-data-release1";
import { insertRelease2 } from "./insert-test-data-release2";
import { insertRelease3 } from "./insert-test-data-release3";
import { insertRelease4 } from "./insert-test-data-release4";
import { insertRelease5 } from "./insert-test-data-release5";
import {
  TEST_SUBJECT_1,
  TEST_SUBJECT_1_DISPLAY,
  TEST_SUBJECT_1_EMAIL,
  TEST_SUBJECT_2,
  TEST_SUBJECT_2_DISPLAY,
  TEST_SUBJECT_2_EMAIL,
  TEST_SUBJECT_3,
  TEST_SUBJECT_3_DISPLAY,
  TEST_SUBJECT_3_EMAIL,
} from "./insert-test-users";
import { insertSystemAuditEvent } from "../../dbschema/queries";
import { DependencyContainer } from "tsyringe";
import { getServices } from "../di-helpers";

export async function insertTestData(dc: DependencyContainer) {
  const { settings, logger, edgeDbClient } = getServices(dc);

  await insert10G(dc);
  await insert10F(dc);
  await insert10C();
  await insertGs(dc);
  await insertBlankDataset("10M", "urn:fdc:umccr.org:2022:dataset/10m");
  // await insertCARDIAC();

  await insertBlankDataset(
    "BM",
    "urn:fdc:australiangenomics.org.au:2022:datasets/bm"
  );
  await insertBlankDataset(
    "MITO",
    "urn:fdc:australiangenomics.org.au:2022:datasets/mito"
  );
  await insertBlankDataset(
    "BOW",
    "urn:fdc:australiangenomics.org.au:2022:datasets/bow"
  );
  await insertBlankDataset(
    "RR",
    "urn:fdc:australiangenomics.org.au:2022:datasets/rr"
  );
  await insertBlankDataset(
    "SS",
    "urn:fdc:australiangenomics.org.au:2022:datasets/ss"
  );
  await insertBlankDataset(
    "TT",
    "urn:fdc:australiangenomics.org.au:2022:datasets/tt"
  );
  await insertBlankDataset(
    "UU",
    "urn:fdc:australiangenomics.org.au:2022:datasets/uu"
  );
  await insertBlankDataset(
    "VV",
    "urn:fdc:australiangenomics.org.au:2022:datasets/vv"
  );
  await insertBlankDataset(
    "WW",
    "urn:fdc:australiangenomics.org.au:2022:datasets/ww"
  );
  await insertBlankDataset(
    "XX",
    "urn:fdc:australiangenomics.org.au:2022:datasets/xx"
  );
  await insertBlankDataset(
    "YY",
    "urn:fdc:australiangenomics.org.au:2022:datasets/yy"
  );
  await insertBlankDataset(
    "ZZ",
    "urn:fdc:australiangenomics.org.au:2022:datasets/zz"
  );

  const r1 = await insertRelease1(dc);
  const r2 = await insertRelease2();
  const r3 = await insertRelease3();
  const r4 = await insertRelease4();
  const r5 = await insertRelease5();

  await createTestUser(
    TEST_SUBJECT_1,
    TEST_SUBJECT_1_DISPLAY,
    TEST_SUBJECT_1_EMAIL,
    [r1.id, r4.id, r5.id],
    [r2.id],
    [],
    true,
    false
  );
  await createTestUser(
    TEST_SUBJECT_2,
    TEST_SUBJECT_2_DISPLAY,
    TEST_SUBJECT_2_EMAIL,
    [],
    [r1.id],
    [],
    false,
    false
  );
  await createTestUser(
    TEST_SUBJECT_3,
    TEST_SUBJECT_3_DISPLAY,
    TEST_SUBJECT_3_EMAIL,
    [],
    [],
    [],
    true,
    true
  );

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
