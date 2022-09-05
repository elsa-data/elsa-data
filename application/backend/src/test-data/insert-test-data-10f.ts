import * as edgedb from "edgedb";
import e, { lab } from "../../dbschema/edgeql-js";
import {
  createArtifacts,
  makeEmptyIdentifierArray,
  makeSystemlessIdentifierArray,
  createFile,
  makeSystemlessIdentifier,
  makeDictionaryIdentifierArray,
  File,
} from "./test-data-helpers";
import { makeSimpsonsTrio } from "./insert-test-data-10f-simpsons";
import { makeTrio, TENF_URI } from "./insert-test-data-10f-helpers";
import { makeJetsonsTrio } from "./insert-test-data-10f-jetsons";
import { randomUUID } from "crypto";

const edgeDbClient = edgedb.createClient();

// we haven't copied some of the other files up yet so we just point to nothing
const blankFile = () =>
  createFile("s3://umccr-10f-data-dev/nothing" + randomUUID({}), 1);

// so these identifiers are used both for insertion values - but can also be in test suites for
// looking up know cases etc

/**
 * The 10F dataset is a subset of the 1000 genomes data with a combination of more complex
 * families.
 */
export async function insert10F() {
  const addPatient = async (
    familyId: string,
    patientId: string,
    specimenId: string,
    sex: "male" | "female" | "other"
  ) => {
    const arts = await createArtifacts(
      blankFile(),
      blankFile(),
      blankFile(),
      blankFile(),
      []
    );
    await e
      .update(e.dataset.DatasetCase, (dc) => ({
        filter: e.op(
          makeSystemlessIdentifier(familyId),
          "in",
          e.set(e.array_unpack(dc.externalIdentifiers))
        ),
        set: {
          patients: {
            "+=": e.insert(e.dataset.DatasetPatient, {
              sexAtBirth: sex,
              externalIdentifiers: makeSystemlessIdentifierArray(patientId),
              specimens: e.insert(e.dataset.DatasetSpecimen, {
                externalIdentifiers: makeSystemlessIdentifierArray(specimenId),
                artifacts: arts,
              }),
            }),
          },
        },
      }))
      .run(edgeDbClient);
  };

  const deletePatient = async (patientId: string) => {
    await e
      .delete(e.dataset.DatasetPatient, (dp) => ({
        filter: e.op(
          makeSystemlessIdentifier(patientId),
          "in",
          e.set(e.array_unpack(dp.externalIdentifiers))
        ),
      }))
      .run(edgeDbClient);
  };

  const tenf = await e
    .insert(e.dataset.Dataset, {
      uri: TENF_URI,
      externalIdentifiers: makeSystemlessIdentifierArray("10F"),
      description: "UMCCR 10F",
      cases: e.set(
        await makeSimpsonsTrio(),
        await makeJetsonsTrio(),
        // convert this to a full family at some point
        await makeTrio(
          { "": "ADDAMS" },
          [],
          { "": "QUINWEDNESDAY" },
          { "": "HG7" },
          "female",
          [blankFile(), blankFile()],
          [blankFile(), blankFile()],
          [],
          [],
          { "": "QUINGGOMEZ" },
          { "": "HG8" },
          [blankFile(), blankFile()],
          [blankFile(), blankFile()],
          [],
          [],
          { "": "QUINMORTICIA" },
          { "": "HG9" },
          [blankFile(), blankFile()],
          [blankFile(), blankFile()],
          [],
          []
          // PUGSLEY
          // UNCLE FESTER - brother of GOMEZ
          // Esmeralda ADDAMS (Grandmama) - mother of MORITICIA
          // COUSIN ITT
        ),
        // convert this to a full family at some point
        await makeTrio(
          { "": "DUCK" },
          [],
          { "": "DONALD" },
          { "": "HG90" },
          "male",
          [blankFile(), blankFile()],
          [blankFile(), blankFile()],
          [],
          [],
          { "": "UNKNOWNDUCK" },
          { "": "HG92" },
          [blankFile(), blankFile()],
          [blankFile(), blankFile()],
          [],
          [],
          { "": "DELLA" },
          { "": "HG91" },
          [blankFile(), blankFile()],
          [blankFile(), blankFile()],
          [],
          []
          // DELLA and DONALD are twins
          // DELLA is mother of
          // HUEY, DEWEY and LOUIE (triplets)
          // SCROOGE in there too
          // DAISY DUCK .. girlfield to donald
        )
      ),
    })
    .run(edgeDbClient);

  // add in some extras to the 'beyond trio' families
  await addPatient("DUCK", "HUEY", "HG93", "male");
  await addPatient("DUCK", "DEWEY", "HG94", "male");
  await addPatient("DUCK", "LOUIE", "HG95", "male");
  await addPatient("DUCK", "SCROOGE", "HG96", "male");
  await addPatient("DUCK", "DAISY", "HG97", "female");
  // we actually want a complex family with no father - so we delete this placeholder duck
  await deletePatient("UNKNOWNDUCK");

  return tenf;
}
