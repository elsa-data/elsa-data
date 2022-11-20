import * as edgedb from "edgedb";
import e, { release } from "../../dbschema/edgeql-js";
import { insertCARDIAC } from "./insert-test-data-cardiac";
import { insert10G } from "./insert-test-data-10g";
import { createTestUser, insertBlankDataset } from "./test-data-helpers";
import { insert10F } from "./insert-test-data-10f";
import { insert10C } from "./insert-test-data-10c";
import { insertRelease1 } from "./insert-test-data-release1";
import { insertRelease2 } from "./insert-test-data-release2";
import { insertRelease3 } from "./insert-test-data-release3";
import { insertRelease4 } from "./insert-test-data-release4";
import { ElsaSettings } from "../config/elsa-settings";

const edgeDbClient = edgedb.createClient();

// these are 3 constants for users that are created *only* in development/test mode
// NOTE: when enabled - these subjects go beyond having some test data in the db - these
// users are enabled in the APIs to do a variety of things
// DON'T LEAVE ON TEST MODE IN AN INSTANCE NOT MEANT FOR TESTING!
export const TEST_SUBJECT_1 = "http://subject1.com";
export const TEST_SUBJECT_2 = "http://subject2.com";
export const TEST_SUBJECT_3 = "http://subject3.com";

export async function insertTestData(settings: ElsaSettings) {
  console.log(`Inserting test data`);
  await insert10G();
  await insert10F();
  await insert10C();
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

  const r1 = await insertRelease1();
  const r2 = await insertRelease2();
  const r3 = await insertRelease3();
  const r4 = await insertRelease4();

  await createTestUser(
    TEST_SUBJECT_1,
    "Test User 1",
    "subject1@elsa.net",
    [r1.id, r4.id],
    [r2.id],
    []
  );
  await createTestUser(
    TEST_SUBJECT_2,
    "Test User 2",
    "subject2@elsa.net",
    [],
    [r1.id],
    []
  );
  await createTestUser(
    TEST_SUBJECT_3,
    "Test User 3",
    "subject3@elsa.net",
    [],
    [],
    []
  );

  console.log(
    `  Number of object artifacts present = ${await e
      .count(e.lab.ArtifactBase)
      .run(edgeDbClient)}`
  );
  console.log(
    `  Number of users present = ${await e
      .count(e.permission.User)
      .run(edgeDbClient)}`
  );
  console.log(
    `  Number of runs present = ${await e.count(e.lab.Run).run(edgeDbClient)}`
  );
  console.log(
    `  Number of releases present = ${await e
      .count(e.release.Release)
      .run(edgeDbClient)}`
  );

  const eachDs = e.for(e.dataset.Dataset, (ds) => {
    return e.select({
      dataset: ds.uri,
      casesCount: e.count(ds.cases),
      patientsCount: e.count(ds.cases.patients),
      specimensCount: e.count(ds.cases.patients.specimens),
    });
  });

  console.log(await eachDs.run(edgeDbClient));
}
