import * as edgedb from "edgedb";
import e, { lab } from "../../dbschema/edgeql-js";
import {
  createArtifacts,
  makeEmptyIdentifierArray,
  makeSystemlessIdentifierArray,
  createFile,
  makeSystemlessIdentifier,
  makeDictionaryIdentifierArray,
} from "./test-data-helpers";

type IdentifierMap = { [system: string]: string };

const edgeDbClient = edgedb.createClient();

export const TENF_URI = "urn:fdc:umccr.org:2022:dataset/10f";

const GIAB_FAMILY_SYSTEM = "giabfamily";

const NIST_BIOSAMPLE_SYSTEM = "http://www.ncbi.nlm.nih.gov/biosample";

const CORIELL_CELL_SYSTEM = "coriellcell";
const CORIELL_DNA_SYSTEM = "corielldna";
const CORIELL_FAMILY_SYSTEM = "coriellfamily";

const PGP_SYSTEM = "https://my.pgp-hms.org";
const THOUSAND_GENOMES_SYSTEM = "1KGP";

// so these identifiers are used both for insertion values - but can also be in test suites for
// looking up know cases etc
export const SIMPSONS_CASE = "SIMPSONS";

export const BART_SPECIMEN = "NA24385";
export const HOMER_SPECIMEN = "NA24149";
export const MARGE_SPECIMEN = "NA24143";

export const BART_PATIENT_1KGP = "HG002";
export const BART_PATIENT_PGP = "huAA53E0";
export const HOMER_PATIENT_1KGP = "HG003";
export const HOMER_PATIENT_PGP = "hu6E4515";
export const MARGE_PATIENT_1KGP = "HG004";
export const MARGE_PATIENT_PGP = "hu8E87A9";

export const JETSONS_CASE = "JETSONS";

export const ELROY_SPECIMEN = "NA24631";
export const GEORGE_SPECIMEN = "NA24694";
export const JUDY_SPECIMEN = "NA24695";

export const ELROY_PATIENT_1KGP = "HG005";
export const ELROY_PATIENT_PGP = "hu91BD69";
export const GEORGE_PATIENT_PGP = "huCA017E";
export const JUDY_PATIENT_PGP = "hu38168C";

/**
 * The 10F dataset is a subset of the 1000 genomes data with a combination of more complex
 * families.
 */
export async function insert10F() {
  const makeArtifacts = async (specimenId: string) => {
    return await createArtifacts(
      createFile(
        `s3://umccr-10f-data-dev/${specimenId}/${specimenId}.hard-filtered.vcf.gz`,
        56456456,
        "NOTREAL"
      ),
      createFile(
        `s3://umccr-10f-data-dev/${specimenId}/${specimenId}.hard-filtered.vcf.gz.tbi`,
        56546
      ),
      createFile(
        `s3://umccr-10f-data-dev/${specimenId}/${specimenId}.bam`,
        123534530,
        "NOT",
        "MD5"
      ),
      createFile(
        `s3://umccr-10f-data-dev/${specimenId}/${specimenId}.bam.bai`,
        3424
      ),
      []
    );
  };

  const makeTrio = async (
    familyId: IdentifierMap,
    probandPatientId: IdentifierMap,
    probandSpecimenId: IdentifierMap,
    probandSex: "male" | "female" | "other",
    fatherPatientId: IdentifierMap,
    fatherSpecimenId: IdentifierMap,
    motherPatientId: IdentifierMap,
    motherSpecimenId: IdentifierMap
  ) => {
    return e.insert(e.dataset.DatasetCase, {
      externalIdentifiers: makeDictionaryIdentifierArray(familyId),
      patients: e.set(
        e.insert(e.dataset.DatasetPatient, {
          sexAtBirth: probandSex,
          externalIdentifiers: makeDictionaryIdentifierArray(probandPatientId),
          specimens: e.insert(e.dataset.DatasetSpecimen, {
            externalIdentifiers:
              makeDictionaryIdentifierArray(probandSpecimenId),
            artifacts: await makeArtifacts(
              probandSpecimenId[CORIELL_DNA_SYSTEM]
            ),
          }),
        }),
        e.insert(e.dataset.DatasetPatient, {
          sexAtBirth: "male",
          externalIdentifiers: makeDictionaryIdentifierArray(fatherPatientId),
          specimens: e.insert(e.dataset.DatasetSpecimen, {
            externalIdentifiers:
              makeDictionaryIdentifierArray(fatherSpecimenId),
            artifacts: await makeArtifacts(
              fatherSpecimenId[CORIELL_DNA_SYSTEM]
            ),
          }),
        }),
        e.insert(e.dataset.DatasetPatient, {
          sexAtBirth: "female",
          externalIdentifiers: makeDictionaryIdentifierArray(motherPatientId),
          specimens: e.insert(e.dataset.DatasetSpecimen, {
            externalIdentifiers:
              makeDictionaryIdentifierArray(motherSpecimenId),
            artifacts: await makeArtifacts(
              motherSpecimenId[CORIELL_DNA_SYSTEM]
            ),
          }),
        })
      ),
    });
  };

  const addPatient = async (
    familyId: string,
    patientId: string,
    specimenId: string,
    sex: "male" | "female" | "other"
  ) => {
    const arts = await makeArtifacts(specimenId);
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

  // Samples from an Ashkenazim trio (son HG002-NA24385-huAA53E0, father HG003-NA24149-hu6E4515, and mother HG004-NA24143-hu8E87A9),
  // Han Chinese trio (son HG005-NA24631-hu91BD69, father NA24694-huCA017E, and mother NA24695-hu38168C) from Personal Genome Project (PGP) are

  const tenf = await e
    .insert(e.dataset.Dataset, {
      uri: TENF_URI,
      externalIdentifiers: makeSystemlessIdentifierArray("10F"),
      description: "UMCCR 10F",
      cases: e.set(
        await makeTrio(
          {
            "": SIMPSONS_CASE,
            [CORIELL_FAMILY_SYSTEM]: "3140",
            [GIAB_FAMILY_SYSTEM]: "ASHKENAZIM",
          },
          // Male	45 YR	White
          {
            "": "BART",
            [THOUSAND_GENOMES_SYSTEM]: BART_PATIENT_1KGP,
            [PGP_SYSTEM]: BART_PATIENT_PGP,
          },
          {
            [CORIELL_DNA_SYSTEM]: BART_SPECIMEN,
            [CORIELL_CELL_SYSTEM]: "GM24385",
          },
          "male",
          // Male	90 YR	White	Unknown
          {
            "": "HOMER",
            [THOUSAND_GENOMES_SYSTEM]: HOMER_PATIENT_1KGP,
            [PGP_SYSTEM]: HOMER_PATIENT_PGP,
          },
          {
            [CORIELL_DNA_SYSTEM]: HOMER_SPECIMEN,
            [CORIELL_CELL_SYSTEM]: "GM24149",
          },
          // Female	74 YR	White	Unknown
          {
            "": "MARGE",
            [THOUSAND_GENOMES_SYSTEM]: MARGE_PATIENT_1KGP,
            [PGP_SYSTEM]: MARGE_PATIENT_PGP,
          },
          {
            [CORIELL_DNA_SYSTEM]: MARGE_SPECIMEN,
            [CORIELL_CELL_SYSTEM]: "GM24143",
          }
        ),
        await makeTrio(
          {
            "": JETSONS_CASE,
            [CORIELL_FAMILY_SYSTEM]: "3150",
            [GIAB_FAMILY_SYSTEM]: "HAN",
          },
          // Male	33 YR	Chinese
          {
            "": "ELROY",
            [THOUSAND_GENOMES_SYSTEM]: ELROY_PATIENT_1KGP,
            [PGP_SYSTEM]: ELROY_PATIENT_PGP,
          },
          {
            [CORIELL_DNA_SYSTEM]: ELROY_SPECIMEN,
            [CORIELL_CELL_SYSTEM]: "GM24631",
          },
          "male",
          // Male	64 YR	Chinese
          // george jetson
          { [PGP_SYSTEM]: GEORGE_PATIENT_PGP },
          {
            [CORIELL_DNA_SYSTEM]: GEORGE_SPECIMEN,
            [CORIELL_CELL_SYSTEM]: "GM24694",
          },
          // Female	63 YR	Chinese
          // Judy jetson
          { [PGP_SYSTEM]: JUDY_PATIENT_PGP },
          {
            [CORIELL_DNA_SYSTEM]: JUDY_SPECIMEN,
            [CORIELL_CELL_SYSTEM]: "GM24694",
          }
        ),
        // convert this to a full family at some point
        await makeTrio(
          { "": "ADDAMS" },
          { "": "QUINWEDNESDAY" },
          { "": "HG7" },
          "female",
          { "": "QUINGGOMEZ" },
          { "": "HG8" },
          { "": "QUINMORTICIA" },
          { "": "HG9" }
          // PUGSLEY
          // UNCLE FESTER - brother of GOMEZ
          // Esmeralda ADDAMS (Grandmama) - mother of MORITICIA
          // COUSIN ITT
        ),
        // convert this to a full family at some point
        await makeTrio(
          { "": "DUCK" },
          { "": "DONALD" },
          { "": "HG90" },
          "male",
          { "": "UNKNOWNDUCK" },
          { "": "HG92" },
          { "": "DELLA" },
          { "": "HG91" }
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
