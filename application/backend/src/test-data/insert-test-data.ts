import * as edgedb from "edgedb";
import e from "../../dbschema/edgeql-js";
import { insertCARDIAC } from "./insert-test-data-cardiac";
import { insert10G } from "./insert-test-data-10g";
import { ApplicationCodedTypeV1 } from "@umccr/elsa-types";

const client = edgedb.createClient();

function makeSystemlessIdentifier(entry1: string) {
  return e.tuple({ system: "", value: entry1 });
}

function makeSystemlessIdentifierArray(entry1: string) {
  return e.array([e.tuple({ system: "", value: entry1 })]);
}

function makeEmptyIdentifierArray() {
  //const identifierTupleType = e.tuple({ system: e.str, value: e.str });

  //return e.literal(identifierTupleType);

  return e.array([e.tuple({ system: "", value: "" })]);
}

export async function blankTestData() {
  console.log(`Removing any existing data in test database`);

  console.log(
    `  ${(await e.delete(e.release.Release).run(client)).length} release(s)`
  );

  console.log(
    `  ${
      (await e.delete(e.dataset.DatasetSpecimen).run(client)).length
    } dataset specimen(s)`
  );
  console.log(
    `  ${
      (await e.delete(e.dataset.DatasetPatient).run(client)).length
    } dataset patient(s)`
  );
  console.log(
    `  ${
      (await e.delete(e.dataset.DatasetCase).run(client)).length
    } dataset case(s)`
  );
  console.log(
    `  ${(await e.delete(e.dataset.Dataset).run(client)).length} dataset(s)`
  );

  console.log(
    `  ${(await e.delete(e.lab.Analyses).run(client)).length} lab analyses(s)`
  );
  console.log(`  ${(await e.delete(e.lab.Run).run(client)).length} lab run(s)`);
  console.log(
    `  ${
      (await e.delete(e.lab.SubmissionBatch).run(client)).length
    } lab submission batch(s)`
  );

  console.log(
    `  ${(await e.delete(e.lab.RunArtifactBcl).run(client)).length} lab bcl(s)`
  );
  console.log(
    `  ${
      (await e.delete(e.lab.RunArtifactFastqPair).run(client)).length
    } lab fastq(s)`
  );
  console.log(
    `  ${
      (await e.delete(e.lab.AnalysesArtifactBam).run(client)).length
    } lab bam(s)`
  );
  console.log(
    `  ${
      (await e.delete(e.lab.AnalysesArtifactVcf).run(client)).length
    } lab vcf(s)`
  );
}

export async function insertTestData() {
  console.log(`Inserting test data`);
  await insert10G();
  await insertCARDIAC();
  //await insertIICON();
  await insertRelease1();

  console.log(
    `  Number of object artifacts present = ${await e
      .count(e.lab.ArtifactBase)
      .run(client)}`
  );
  console.log(
    `  Number of runs present = ${await e.count(e.lab.Run).run(client)}`
  );
  console.log(
    `  Number of releases present = ${await e
      .count(e.release.Release)
      .run(client)}`
  );

  const eachDs = e.for(e.dataset.Dataset, (ds) => {
    return e.select({
      dataset: ds.description,
      casesCount: e.count(ds.cases),
      patientsCount: e.count(ds.cases.patients),
      specimensCount: e.count(ds.cases.patients.specimens),
    });
  });

  console.log(await eachDs.run(client));
}

async function insertRelease1() {
  const appCoded: ApplicationCodedTypeV1 = {
    version: 1,
    researchersInvolved: [],
    countriesInvolved: ["AU"],
    researchType: {
      code: "DS",
      diseases: ["SNOMED:asdad"],
    },
    institutesInvolved: [],
  };

  const r1 = await e
    .insert(e.release.Release, {
      created: e.datetime(new Date()),
      applicationIdentifier: "ABC",
      applicationCoded: e.json(appCoded),
      datasets: e.select(e.dataset.Dataset, (ds) => ({
        filter: e.op(
          makeSystemlessIdentifier("CARDIAC"),
          "in",
          e.array_unpack(ds.externalIdentifiers)
        ),
      })),
    })
    .run(client);

  const r2 = await e
    .insert(e.release.Release, {
      created: e.datetime(new Date()),
      datasets: e.select(e.dataset.Dataset, (ds) => ({
        filter: e.op(
          makeSystemlessIdentifier("CARDIAC"),
          "in",
          e.array_unpack(ds.externalIdentifiers)
        ),
      })),
    })
    .run(client);
}
