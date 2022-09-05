import * as edgedb from "edgedb";
import e, { lab } from "../../dbschema/edgeql-js";
import {
  createArtifacts,
  makeEmptyIdentifierArray,
  makeSystemlessIdentifierArray,
  createFile,
} from "./test-data-helpers";

const edgeDbClient = edgedb.createClient();

export const TENC_URI = "urn:fdc:umccr.org:2022:dataset/10c";

/**
 * The 10C dataset is cancer patients
 */
export async function insert10C() {
  const makeArtifacts = async (specimenId: string) => {
    return await createArtifacts(
      createFile(
        `s3://umccr-10c-data-dev/${specimenId}/${specimenId}.hard-filtered.vcf.gz`,
        56456456,
        "NOTREAL"
      ),
      createFile(
        `s3://umccr-10c-data-dev/${specimenId}/${specimenId}.hard-filtered.vcf.gz.tbi`,
        56546
      ),
      createFile(
        `s3://umccr-10c-data-dev/${specimenId}/${specimenId}.bam`,
        123534530,
        "NOT",
        "MD5"
      ),
      createFile(
        `s3://umccr-10c-data-dev/${specimenId}/${specimenId}.bam.bai`,
        3424
      ),
      []
    );
  };

  const makeTumourNormal = async (
    caseId: string,
    patientId: string,
    patientSex: "male" | "female" | "other",
    normalSpecimenId: string,
    tumourSpecimenId: string
  ) => {
    return e.insert(e.dataset.DatasetCase, {
      externalIdentifiers: makeSystemlessIdentifierArray(caseId),
      patients: e.set(
        e.insert(e.dataset.DatasetPatient, {
          sexAtBirth: patientSex,
          externalIdentifiers: makeSystemlessIdentifierArray(patientId),
          specimens: e.set(
            e.insert(e.dataset.DatasetSpecimen, {
              externalIdentifiers:
                makeSystemlessIdentifierArray(normalSpecimenId),
              artifacts: await makeArtifacts(normalSpecimenId),
            }),
            e.insert(e.dataset.DatasetSpecimen, {
              externalIdentifiers:
                makeSystemlessIdentifierArray(tumourSpecimenId),
              artifacts: await makeArtifacts(tumourSpecimenId),
            })
          ),
        })
      ),
    });
  };

  const tenc = await e
    .insert(e.dataset.Dataset, {
      uri: "urn:fdc:umccr.org:2022:dataset/10c",
      externalIdentifiers: makeSystemlessIdentifierArray("10C"),
      description: "UMCCR 10C",
      cases: e.set(
        await makeTumourNormal(
          "AG6583",
          "UR87643",
          "male",
          "N123115",
          "T908765"
        ),
        await makeTumourNormal(
          "AG1023",
          "UR23456",
          "female",
          "N757567",
          "T657567"
        )
      ),
    })
    .run(edgeDbClient);
}
