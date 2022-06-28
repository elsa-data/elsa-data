import * as edgedb from "edgedb";
import e, { release } from "../../dbschema/edgeql-js";
import { insertCARDIAC } from "./insert-test-data-cardiac";
import { insert10G } from "./insert-test-data-10g";
import { ElsaSettings } from "../bootstrap-settings";
import {
  createTestUser,
  findSpecimen,
  insertBlankDataset,
  makeEmptyCodeArray,
  makeSingleCodeArray,
  makeTripleCodeArray,
} from "./insert-test-data-helpers";
import { insert10F } from "./insert-test-data-10f";
import { insert10C } from "./insert-test-data-10c";
import ApplicationCodedStudyType = release.ApplicationCodedStudyType;

const edgeDbClient = edgedb.createClient();

export async function insertTestData(settings: ElsaSettings) {
  console.log(`Inserting test data`);
  await insert10G();
  await insert10F();
  await insert10C();
  await insertCARDIAC();

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

  await insertBlankDataset("BOWEL", "http://cci.org.au/datasets/BOWEL");

  await insertRelease1(settings);

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

async function insertRelease1(settings: ElsaSettings) {
  const mondoUri = "http://purl.obolibrary.org/obo/mondo.owl";

  const r1 = await e
    .insert(e.release.Release, {
      created: e.datetime(new Date()),
      applicationDacTitle: "A Study of Lots of Test Data",
      applicationDacIdentifier: "ABC",
      applicationCoded: e.insert(e.release.ApplicationCoded, {
        studyType: ApplicationCodedStudyType.DS,
        countriesInvolved: makeSingleCodeArray("urn:iso:std:iso:3166", "AU"),
        diseasesOfStudy: makeTripleCodeArray(
          mondoUri,
          "MONDO:0008678",
          mondoUri,
          "",
          mondoUri,
          "MONDO:0021531"
        ),
        institutesInvolved: makeEmptyCodeArray(),
        studyAgreesToPublish: true,
        studyIsNotCommercial: true,
      }),
      datasetUris: e.array([
        "urn:fdc:umccr.org:2022:dataset/10g",
        "urn:fdc:umccr.org:2022:dataset/10f",
        "urn:fdc:umccr.org:2022:dataset/10c",
      ]),
      selectedSpecimens: e.set(
        findSpecimen("HG1"),
        findSpecimen("HG2"),
        findSpecimen("HG3"),
        findSpecimen("HG4")
      ),
      manualExclusions: e.set(),
    })
    .run(edgeDbClient);

  const r2 = await e
    .insert(e.release.Release, {
      created: e.datetime(new Date()),
      applicationDacIdentifier: "XYZ",
      applicationCoded: e.insert(e.release.ApplicationCoded, {
        studyType: ApplicationCodedStudyType.HMB,
        countriesInvolved: makeEmptyCodeArray(),
        diseasesOfStudy: makeEmptyCodeArray(),
        institutesInvolved: makeEmptyCodeArray(),
        studyAgreesToPublish: true,
        studyIsNotCommercial: true,
      }),
      datasetUris: e.array([
        "urn:fdc:australiangenomics.org.au:2022:datasets/cardiac",
      ]),
      selectedSpecimens: e.set(
        findSpecimen("HG1"),
        findSpecimen("HG2"),
        findSpecimen("HG3"),
        findSpecimen("HG4")
      ),
      manualExclusions: e.set(),
    })
    .run(edgeDbClient);

  await createTestUser(
    "http://subject1.com",
    "Test User 1",
    [r1.id],
    [r2.id],
    []
  );
  await createTestUser("http://subject2.com", "Test User 2", [], [r1.id], []);
}
