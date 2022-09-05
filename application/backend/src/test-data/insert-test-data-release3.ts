import * as edgedb from "edgedb";
import e, { release } from "../../dbschema/edgeql-js";
import {
  makeEmptyCodeArray,
  makeSystemlessIdentifier,
} from "./test-data-helpers";
import ApplicationCodedStudyType = release.ApplicationCodedStudyType;

const edgeDbClient = edgedb.createClient();

export async function insertRelease3() {
  // r3 is a test release that no-one has any permissions into - so should not
  // appear in any queries
  return await e
    .insert(e.release.Release, {
      applicationDacTitle: "An Invisible Study",
      applicationDacIdentifier: makeSystemlessIdentifier("DEF"),
      applicationDacDetails: "",
      applicationCoded: e.insert(e.release.ApplicationCoded, {
        studyType: ApplicationCodedStudyType.HMB,
        countriesInvolved: makeEmptyCodeArray(),
        diseasesOfStudy: makeEmptyCodeArray(),
        studyAgreesToPublish: true,
        studyIsNotCommercial: true,
      }),
      releasePassword: "apassword", // pragma: allowlist secret
      datasetUris: e.array([
        "urn:fdc:australiangenomics.org.au:2022:datasets/cardiac",
      ]),
      datasetCaseUrisOrderPreference: [""],
      datasetSpecimenUrisOrderPreference: [""],
      datasetIndividualUrisOrderPreference: [""],
      releaseIdentifier: "B",
      selectedSpecimens: e.set(),
      auditLog: e.set(
        e.insert(e.audit.ReleaseAuditEvent, {
          actionCategory: "C",
          actionDescription: "Created Release",
          outcome: 0,
          whoDisplayName: "Someone",
          whoId: "a",
          occurredDateTime: e.datetime_current(),
        }),
      ),
    })
    .run(edgeDbClient);
}
