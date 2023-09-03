import e from "../../../dbschema/edgeql-js";
import {
  createArtifacts,
  createFile,
  makeSystemlessIdentifier,
  makeSystemlessIdentifierArray,
} from "../util/test-data-helpers";
import { makeSimpsonsTrio } from "./insert-test-data-10f-simpsons";
import {
  makeTrio,
  TENF_DESCRIPTION,
  TENF_URI,
} from "./insert-test-data-10f-helpers";
import { makeJetsonsTrio } from "./insert-test-data-10f-jetsons";
import { randomUUID } from "crypto";
import { DependencyContainer } from "tsyringe";
import { getServices } from "../../di-helpers";

// we haven't copied some of the other files up yet so we just point to nothing
const blankFile = () =>
  createFile("s3://umccr-10f-data-dev/nothing" + randomUUID({}), 1);

// so these identifiers are used both for insertion values - but can also be in test suites for
// looking up know cases etc

/**
 * The 10F dataset is a subset of the 1000 genomes data with a combination of more complex
 * families.
 */
export async function insert10F(dc: DependencyContainer): Promise<string> {
  const { edgeDbClient } = getServices(dc);

  // upsert our record of this dataset in the database
  // (this is needed to hang all the actual cases records off this record)
  await e
    .insert(e.dataset.Dataset, {
      uri: TENF_URI,
      externalIdentifiers: makeSystemlessIdentifierArray("10F"),
      description: TENF_DESCRIPTION,
      cases: e.set(),
    })
    .unlessConflict((ds) => ({
      on: ds.uri,
      else: e.update(ds, () => ({
        set: {
          description: TENF_DESCRIPTION,
        },
      })),
    }))
    .run(edgeDbClient);

  const addPatient = async (
    familyId: string,
    patientId: string,
    specimenId: string,
    sex: "male" | "female" | "other"
  ) => {
    const arts = await createArtifacts(
      [],
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

  const simpsons = await makeSimpsonsTrio(dc);
  const jetsons = await makeJetsonsTrio();
  const addams = await makeTrio(
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
    [],
    ["ADDAMS", "QUINGGOMEZ", "QUINMORTICIA"]
    // PUGSLEY
    // UNCLE FESTER - brother of GOMEZ
    // Esmeralda ADDAMS (Grandmama) - mother of MORTICIA
    // COUSIN ITT
  );
  const ducks = await makeTrio(
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
    [],
    ["DUCK", "UNKNOWNDUCK", "DELLA"]
    // DELLA and DONALD are twins
    // DELLA is mother of
    // HUEY, DEWEY and LOUIE (triplets)
    // SCROOGE in there too
    // DAISY DUCK .. girlfield to donald
  );

  await e
    .update(e.dataset.Dataset, (ds) => ({
      filter: e.op(ds.uri, "=", TENF_URI),
      set: {
        cases: e.set(
          simpsons,
          jetsons,
          // convert this to a full family at some point
          addams,
          // convert this to a full family at some point
          ducks
        ),
        updatedDateTime: e.datetime_current(),
      },
    }))
    .run(edgeDbClient);

  // add in some extras to the 'beyond trio' families
  await addPatient("DUCK", "HUEY", "HG93", "male");
  await addPatient("DUCK", "DEWEY", "HG94", "male");
  await addPatient("DUCK", "LOUIE", "HG95", "male");
  await addPatient("DUCK", "SCROOGE", "HG96", "male");
  await addPatient("DUCK", "DAISY", "HG97", "female");
  // we actually want a complex family with no father - so we delete this placeholder duck
  await deletePatient("UNKNOWNDUCK");

  return TENF_URI;
}
